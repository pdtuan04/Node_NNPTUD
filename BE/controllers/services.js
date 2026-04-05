let serviceModel = require("../schemas/services");
let bookingModel = require("../schemas/bookings");

module.exports = {
  GetAllActiveServices: async function () {
    try {
      const services = await serviceModel
        .find({
          isActive: true,
          isDeleted: false,
        })
        .sort({ name: 1 })
        .lean();

      return services.map((s) => {
        const { _id, ...rest } = s;
        return { ...rest, id: _id.toString() };
      });
    } catch (error) {
      throw new Error("Lỗi khi tải danh sách dịch vụ: " + error.message);
    }
  },

  GetServicesByPetType: async function (petTypeId) {
    try {
      const services = await serviceModel
        .find({
          petTypes: petTypeId,
          isActive: true,
          isDeleted: false,
        })
        .lean();

      return services.map((s) => {
        const { _id, ...rest } = s;
        return { ...rest, id: _id.toString() };
      });
    } catch (error) {
      return [];
    }
  },

  GetAllServicesPaginated: async function (
    search,
    pageNumber,
    pageSize,
    sortBy,
    sortDir,
  ) {
    try {
      let searchQuery = { isDeleted: false };

      if (search && search.trim() !== "") {
        searchQuery.$or = [
          { name: { $regex: search, $options: "i" } },
          { description: { $regex: search, $options: "i" } },
        ];
      }

      const sortDirection = sortDir === "Ascending" ? 1 : -1;
      const sortObject = { [sortBy]: sortDirection };
      const skip = (pageNumber - 1) * pageSize;

      const services = await serviceModel
        .find(searchQuery)
        .sort(sortObject)
        .skip(skip)
        .limit(pageSize)
        .lean();

      const totalCount = await serviceModel.countDocuments(searchQuery);

      const mappedServices = services.map((s) => {
        const { _id, ...rest } = s;
        return { ...rest, id: _id.toString() };
      });

      return {
        services: mappedServices,
        totalCount: totalCount,
      };
    } catch (error) {
      throw new Error("Lỗi khi tải danh sách dịch vụ: " + error.message);
    }
  },

  GetServiceById: async function (id) {
    try {
      const service = await serviceModel
        .findOne({
          _id: id,
          isDeleted: false,
        })
        .lean();

      if (!service) {
        throw new Error("Không tìm thấy dịch vụ");
      }

      const { _id, ...rest } = service;
      return { ...rest, id: _id.toString() };
    } catch (error) {
      throw error;
    }
  },

  CreateService: async function (data) {
    try {
      const existingService = await serviceModel.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
        isDeleted: false,
      });

      if (existingService) {
        throw new Error(`Tên dịch vụ '${data.name}' đã tồn tại`);
      }

      if (!data.price || data.price <= 0) {
        throw new Error("Giá dịch vụ phải lớn hơn 0");
      }

      if (!data.durationInMinutes || data.durationInMinutes < 15) {
        throw new Error("Thời gian thực hiện phải tối thiểu 15 phút");
      }

      const newService = new serviceModel({
        name: data.name,
        description: data.description || "",
        price: data.price,
        durationInMinutes: data.durationInMinutes,
        imageUrl: data.imageUrl || "",
        isActive: data.isActive !== undefined ? data.isActive : true,
        isDeleted: false,
      });

      const saved = await newService.save();

      return {
        id: saved._id.toString(),
        name: saved.name,
        description: saved.description,
        price: saved.price,
        durationInMinutes: saved.durationInMinutes,
        imageUrl: saved.imageUrl,
        isActive: saved.isActive,
      };
    } catch (error) {
      throw error;
    }
  },

  UpdateService: async function (id, data) {
    try {
      const existingService = await serviceModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!existingService) {
        throw new Error("Không tìm thấy dịch vụ");
      }

      const duplicateName = await serviceModel.findOne({
        name: { $regex: new RegExp(`^${data.name}$`, "i") },
        _id: { $ne: id },
        isDeleted: false,
      });

      if (duplicateName) {
        throw new Error(`Tên dịch vụ '${data.name}' đã tồn tại`);
      }

      if (!data.price || data.price <= 0) {
        throw new Error("Giá dịch vụ phải lớn hơn 0");
      }

      if (!data.durationInMinutes || data.durationInMinutes < 15) {
        throw new Error("Thời gian thực hiện phải tối thiểu 15 phút");
      }

      existingService.name = data.name;
      existingService.description = data.description || "";
      existingService.price = data.price;
      existingService.durationInMinutes = data.durationInMinutes;
      existingService.imageUrl = data.imageUrl || existingService.imageUrl;
      existingService.isActive =
        data.isActive !== undefined ? data.isActive : existingService.isActive;

      const updated = await existingService.save();

      return {
        id: updated._id.toString(),
        name: updated.name,
        description: updated.description,
        price: updated.price,
        durationInMinutes: updated.durationInMinutes,
        imageUrl: updated.imageUrl,
        isActive: updated.isActive,
      };
    } catch (error) {
      throw error;
    }
  },

  ToggleActiveService: async function (id) {
    try {
      const service = await serviceModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!service) {
        throw new Error("Không tìm thấy dịch vụ");
      }

      service.isActive = !service.isActive;

      return await service.save();
    } catch (error) {
      throw error;
    }
  },

  SoftDeleteService: async function (id) {
    try {
      const service = await serviceModel.findOne({
        _id: id,
        isDeleted: false,
      });

      if (!service) {
        throw new Error("Không tìm thấy dịch vụ");
      }

      const activeBookings = await bookingModel.countDocuments({
        "services.service": id,
        bookingStatus: {
          $nin: ["COMPLETED", "CANCELLED", "NO_SHOW"],
        },
        isDeleted: false,
      });

      if (activeBookings > 0) {
        throw new Error(
          `Không thể xóa dịch vụ đang có ${activeBookings} lịch hẹn chưa hoàn thành. ` +
            `Vui lòng chuyển sang trạng thái "Ngưng hoạt động".`,
        );
      }

      service.isDeleted = true;
      service.isActive = false;

      return await service.save();
    } catch (error) {
      throw error;
    }
  },

  GetDeletedServices: async function (pageNumber, pageSize) {
    try {
      const searchQuery = { isDeleted: true };
      const skip = (pageNumber - 1) * pageSize;

      const services = await serviceModel
        .find(searchQuery)
        .sort({ updatedAt: -1 })
        .skip(skip)
        .limit(pageSize)
        .lean();

      const totalCount = await serviceModel.countDocuments(searchQuery);

      const mappedServices = services.map((s) => {
        const { _id, ...rest } = s;
        return { ...rest, id: _id.toString() };
      });

      return {
        services: mappedServices,
        totalCount: totalCount,
      };
    } catch (error) {
      throw new Error("Lỗi khi tải danh sách dịch vụ đã xóa: " + error.message);
    }
  },

  RestoreService: async function (id) {
    try {
      const service = await serviceModel.findOne({
        _id: id,
        isDeleted: true,
      });

      if (!service) {
        throw new Error("Không tìm thấy dịch vụ trong thùng rác");
      }

      service.isDeleted = false;

      return await service.save();
    } catch (error) {
      throw error;
    }
  },
};

let staffModel = require("../schemas/staff");
let userModel = require("../schemas/users");
let roleModel = require("../schemas/roles");
let bcrypt = require("bcrypt");
let { sendStaffWelcomeEmail } = require("../utils/sendMail");

// Helper function to generate staff code
function generateStaffCode(count) {
  const year = new Date().getFullYear().toString().slice(-2);
  const sequence = String(count + 1).padStart(4, "0");
  return `STF${year}${sequence}`;
}

// Helper function to generate username from email
function generateUsername(email) {
  return email.substring(0, email.indexOf("@")).toLowerCase();
}

// Helper function to generate temporary password
function generateTemporaryPassword() {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
  let password = "";
  for (let i = 0; i < 10; i++) {
    password += characters.charAt(
      Math.floor(Math.random() * characters.length),
    );
  }
  return password;
}

module.exports = {
  CreateStaff: async function (staffData) {
    // Validate email uniqueness in User
    const existingUserByEmail = await userModel.findOne({
      email: staffData.email,
      isDeleted: false,
    });
    if (existingUserByEmail) {
      throw new Error("Email đã tồn tại trong hệ thống");
    }

    // Validate phone uniqueness in User
    if (staffData.phoneNumber) {
      const existingUserByPhone = await userModel.findOne({
        phone: staffData.phoneNumber,
        isDeleted: false,
      });
      if (existingUserByPhone) {
        throw new Error("Số điện thoại đã được sử dụng bởi tài khoản khác");
      }
    }

    // Validate phone uniqueness in Staff
    if (staffData.phoneNumber) {
      const existingStaffByPhone = await staffModel.findOne({
        phoneNumber: staffData.phoneNumber,
        isDeleted: false,
      });
      if (existingStaffByPhone) {
        throw new Error("Số điện thoại đã tồn tại");
      }
    }

    // Generate staff code
    const staffCount = await staffModel.countDocuments();
    const staffCode = generateStaffCode(staffCount);

    // Generate username from email
    let username = generateUsername(staffData.email);

    // Check username uniqueness
    let counter = 1;
    const originalUsername = username;
    while (await userModel.findOne({ username: username, isDeleted: false })) {
      username = originalUsername + counter;
      counter++;
    }

    // Generate temporary password
    const temporaryPassword = generateTemporaryPassword();

    // Find STAFF role, fallback to USER role
    let staffRole = await roleModel.findOne({
      name: "STAFF",
      isDeleted: false,
    });
    if (!staffRole) {
      staffRole = await roleModel.findOne({ name: "USER", isDeleted: false });
      if (!staffRole) {
        throw new Error("Role USER không tồn tại");
      }
    }

    // Create User account
    const newUser = new userModel({
      username: username,
      password: temporaryPassword,
      email: staffData.email,
      fullName: staffData.fullName,
      avatarUrl:
        staffData.profilePictureUrl || "https://i.sstatic.net/l60Hf.png",
      role: staffRole._id,
      status: true,
    });
    await newUser.save();

    // Create Staff
    const newStaff = new staffModel({
      staffCode: staffCode,
      fullName: staffData.fullName,
      email: staffData.email,
      phoneNumber: staffData.phoneNumber,
      address: staffData.address,
      dateOfBirth: staffData.dateOfBirth,
      hireDate: staffData.hireDate || new Date(),
      department: staffData.department,
      position: staffData.position,
      specialization: staffData.specialization,
      profilePictureUrl: staffData.profilePictureUrl,
      isActive: true,
      userId: newUser._id,
    });
    await newStaff.save();

    // Send welcome email
    try {
      await sendStaffWelcomeEmail(
        staffData.email,
        staffData.fullName,
        username,
        temporaryPassword,
        staffCode,
      );
      console.log("Email queued for sending to:", staffData.email);
    } catch (error) {
      console.error("Failed to send welcome email:", error.message);
    }

    return {
      staffId: newStaff._id,
      staffCode: staffCode,
      fullName: staffData.fullName,
      email: staffData.email,
      username: username,
      temporaryPassword: temporaryPassword,
      mustChangePassword: true,
    };
  },

  GetAllStaff: async function (pageNumber, pageSize, search, sortBy, sortDir) {
    const skip = (pageNumber - 1) * pageSize;
    const sortOrder = sortDir === "Descending" ? -1 : 1;
    const sortObj = { [sortBy]: sortOrder };

    let query = { isDeleted: false };

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullName: searchRegex },
        { staffCode: searchRegex },
        { email: searchRegex },
        { phoneNumber: searchRegex },
      ];
    }

    const totalCount = await staffModel.countDocuments(query);
    const items = await staffModel
      .find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(pageSize)
      .lean();

    // Map _id to id for frontend compatibility
    const mappedItems = items.map((item) => {
      const { _id, ...rest } = item;
      return {
        ...rest,
        id: _id.toString(),
        isDeleted: rest.isDeleted || false,
      };
    });

    return {
      items: mappedItems,
      totalCount: totalCount,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  },

  GetStaffById: async function (id) {
    const staff = await staffModel
      .findOne({ _id: id })
      .populate("userId", "username")
      .lean();

    if (!staff) {
      throw new Error("Không tìm thấy nhân viên");
    }

    return {
      id: staff._id.toString(),
      staffCode: staff.staffCode,
      fullName: staff.fullName,
      email: staff.email,
      phoneNumber: staff.phoneNumber,
      address: staff.address,
      dateOfBirth: staff.dateOfBirth,
      hireDate: staff.hireDate,
      department: staff.department,
      position: staff.position,
      specialization: staff.specialization,
      profilePictureUrl: staff.profilePictureUrl,
      isActive: staff.isActive,
      isDeleted: staff.isDeleted || false,
      username: staff.userId ? staff.userId.username : null,
      createdAt: staff.createdAt,
      updatedAt: staff.updatedAt,
    };
  },

  UpdateStaff: async function (id, staffData) {
    const staff = await staffModel
      .findOne({ _id: id, isDeleted: false })
      .populate("userId");
    if (!staff) {
      throw new Error("Không tìm thấy nhân viên");
    }

    // Check email uniqueness if changed (email should not be changed)
    if (staffData.email && staff.email !== staffData.email) {
      const existingUser = await userModel.findOne({
        email: staffData.email,
        isDeleted: false,
      });
      if (existingUser) {
        throw new Error("Email đã tồn tại trong hệ thống");
      }
      staff.email = staffData.email;
      staff.userId.email = staffData.email;
    }

    // Check phone uniqueness if changed
    if (staffData.phoneNumber && staff.phoneNumber !== staffData.phoneNumber) {
      const existingStaff = await staffModel.findOne({
        phoneNumber: staffData.phoneNumber,
        isDeleted: false,
        _id: { $ne: id },
      });
      if (existingStaff) {
        throw new Error("Số điện thoại đã tồn tại");
      }
      staff.phoneNumber = staffData.phoneNumber;
    }

    // Update staff fields
    staff.fullName = staffData.fullName || staff.fullName;
    staff.address = staffData.address;
    staff.dateOfBirth = staffData.dateOfBirth;
    staff.hireDate = staffData.hireDate;
    staff.department = staffData.department;
    staff.position = staffData.position;
    staff.specialization = staffData.specialization;
    staff.profilePictureUrl = staffData.profilePictureUrl;

    // Update user fields
    staff.userId.fullName = staffData.fullName || staff.fullName;
    staff.userId.avatarUrl =
      staffData.profilePictureUrl || staff.userId.avatarUrl;

    await staff.save();
    await staff.userId.save();

    return await this.GetStaffById(id);
  },

  ToggleActive: async function (id) {
    const staff = await staffModel.findOne({ _id: id, isDeleted: false });
    if (!staff) {
      throw new Error("Không tìm thấy nhân viên");
    }

    staff.isActive = !staff.isActive;
    await staff.save();

    return staff;
  },

  DeleteStaff: async function (id) {
    const staff = await staffModel.findOne({ _id: id, isDeleted: false });
    if (!staff) {
      throw new Error("Không tìm thấy nhân viên");
    }

    // Soft delete
    staff.isDeleted = true;
    await staff.save();

    return staff;
  },

  CountActiveStaff: async function () {
    return await staffModel.countDocuments({
      isActive: true,
      isDeleted: false,
    });
  },

  GetDeletedStaff: async function (pageNumber, pageSize) {
    const skip = (pageNumber - 1) * pageSize;
    const query = { isDeleted: true };

    const totalCount = await staffModel.countDocuments(query);
    const items = await staffModel
      .find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(pageSize)
      .lean();

    const mappedItems = items.map((item) => {
      const { _id, ...rest } = item;
      return {
        ...rest,
        id: _id.toString(),
      };
    });

    return {
      items: mappedItems,
      totalCount: totalCount,
      pageNumber: pageNumber,
      pageSize: pageSize,
      totalPages: Math.ceil(totalCount / pageSize),
    };
  },

  RestoreStaff: async function (id) {
    const staff = await staffModel.findOne({ _id: id, isDeleted: true });
    if (!staff) {
      throw new Error("Không tìm thấy nhân viên trong thùng rác");
    }

    staff.isDeleted = false;
    await staff.save();

    return staff;
  },
};

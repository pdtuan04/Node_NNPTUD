let petTypeModel = require('../schemas/petTypes');

module.exports = {
    getActivePetTypes: async function () {
        return await petTypeModel.find({ isDeleted: false, isActive: true });
    },

    getPaginatedList: async function (Search, SortBy, SortDir, PageNumber, PageSize) {
        let query = { isDeleted: false };
        if (Search && Search.trim() !== '') {
            query.name = { $regex: Search, $options: 'i' };
        }

        let sort = {};
        let actualSortBy = SortBy === 'id' ? '_id' : SortBy;
        sort[actualSortBy] = (SortDir === 'Ascending' || SortDir === 'asc') ? 1 : -1;

        let skip = (PageNumber - 1) * PageSize;

        let totalElements = await petTypeModel.countDocuments(query);
        let items = await petTypeModel.find(query)
            .sort(sort)
            .skip(skip)
            .limit(PageSize);

        return {
            items: items,
            pageNumber: PageNumber,
            pageSize: PageSize,
            totalElements: totalElements,
            totalPages: Math.ceil(totalElements / PageSize)
        };
    },

    getPetTypeById: async function (id) {
        let res = await petTypeModel.findById(id);
        if (!res) throw new Error("Không tìm thấy thú cưng");
        return res;
    },

    createPetType: async function (request) {
        let newItem = new petTypeModel({
            name: request.name,
            description: request.description,
            image: request.image,
            isActive: request.isActive !== undefined ? request.isActive : true
        });
        return await newItem.save();
    },

    updatePetType: async function (request) {
        let id = request.id || request._id;
        if (!id) throw new Error("Missing ID");
        let updateData = { ...request };
        delete updateData._id;
        delete updateData.id;

        let updated = await petTypeModel.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );
        if (!updated) throw new Error("Không tìm thấy thú cưng để cập nhật");
        return updated;
    },

    inactivePetType: async function (id) {
        if (!id) throw new Error("Missing ID");
        let updated = await petTypeModel.findByIdAndUpdate(id, { isActive: false }, { new: true });
        if (!updated) throw new Error("Không tìm thấy thú cưng");
        return updated;
    },

    activePetType: async function (id) {
        if (!id) throw new Error("Missing ID");
        let updated = await petTypeModel.findByIdAndUpdate(id, { isActive: true }, { new: true });
        if (!updated) throw new Error("Không tìm thấy thú cưng");
        return updated;
    },

    deletePetType: async function (id) {
        if (!id) throw new Error("Missing ID");
        let deleted = await petTypeModel.findByIdAndDelete(id);
        if (!deleted) throw new Error("Không tìm thấy thú cưng");
        return deleted;
    }
};
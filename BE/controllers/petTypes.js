let petTypeModel = require('../schemas/petTypes');

module.exports = {
    GetAllPetTypes: async function () {
        try {
            return await petTypeModel.find({ 
                isDeleted: false,
                isActive: true 
            });
        } catch (error) {
            return [];
        }
    }
};
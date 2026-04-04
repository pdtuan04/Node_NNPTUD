let serviceModel = require('../schemas/services');

module.exports = {
    GetServicesByPetType: async function (petTypeId) {
        try {
            return await serviceModel.find({ 
                petTypes: petTypeId, 
                isActive: true, 
                isDeleted: false 
            });
        } catch (error) {
            return [];
        }
    }
};
let petModel = require('../schemas/pets');

module.exports = {
    GetPetsByUser: async function (userId) {
        try {
            return await petModel.find({ user: userId, isDeleted: false }).populate('petType');
        } catch (error) {
            return [];
        }
    },
    CreatePet: async function (userId, name, petTypeId, age) {
        try {
            let newPet = new petModel({
                user: userId,
                name: name,
                petType: petTypeId,
                age: age
            });
            await newPet.save();
            return await newPet.populate('petType');
        } catch (error) {
            return false;
        }
    }
};
let petModel = require('../schemas/pets');

module.exports = {
    GetPetsByUser: async function (userId) {
        try {
            return await petModel.find({ user: userId, isDeleted: false }).populate('petType').populate('user');
        } catch (error) {
            return [];
        }
    },
    GetAllPets: async function () {
        try {
            return await petModel.find({ isDeleted: false }).populate('petType').populate('user');
        } catch (error) {
            return [];
        }
    },
    CreatePet: async function (userId, name, petTypeId, age, imageUrl) {
        try {
            let newPet = new petModel({
                user: userId,
                name: name,
                petType: petTypeId,
                age: age,
                imageUrl: imageUrl || ""
            });
            await newPet.save();
            return await newPet.populate('petType');
        } catch (error) {
            return false;
        }
    },
    UpdatePet: async function (userId, petId, name, petTypeId, age, imageUrl) {
        try {
            const pet = await petModel.findOne({ _id: petId, user: userId, isDeleted: false });
            if (!pet) return false;
            pet.name = name;
            pet.petType = petTypeId;
            pet.age = age;
            if (imageUrl !== undefined) pet.imageUrl = imageUrl || "";
            await pet.save();
            return await pet.populate('petType');
        } catch (error) {
            return false;
        }
    },
    DeletePet: async function (userId, petId) {
        try {
            const pet = await petModel.findOne({ _id: petId, user: userId, isDeleted: false });
            if (!pet) return false;
            pet.isDeleted = true;
            await pet.save();
            return true;
        } catch (error) {
            return false;
        }
    }
};
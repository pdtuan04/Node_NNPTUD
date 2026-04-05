const { toLegacyNumericId, toRawId } = require("./compatIds");

const bookingStatusToCode = {
  PENDING: 0,
  PENDING_PAYMENT: 1,
  CONFIRMED: 2,
  IN_PROGRESS: 3,
  COMPLETED: 4,
  CANCELLED: 5,
  NO_SHOW: 6,
};

function presentPetType(petType) {
  if (!petType) return null;

  return {
    id: toLegacyNumericId(petType._id || petType.id),
    mongoId: toRawId(petType._id || petType.id),
    name: petType.name,
    image: petType.image || "",
    isActive: petType.isActive,
  };
}

function presentPet(pet) {
  if (!pet) return null;

  const petTypeSource = pet.petType && typeof pet.petType === "object" ? pet.petType : null;
  const petTypeId = petTypeSource ? petTypeSource._id || petTypeSource.id : pet.petType;

  return {
    id: toLegacyNumericId(pet._id || pet.id),
    mongoId: toRawId(pet._id || pet.id),
    name: pet.name,
    age: pet.age || 0,
    imageUrl: pet.imageUrl || "",
    petTypeId: toLegacyNumericId(petTypeId),
    petTypeMongoId: toRawId(petTypeId),
    petTypeName: petTypeSource ? petTypeSource.name : "",
  };
}

function presentBooking(booking) {
  if (!booking) return null;

  const user = booking.user && typeof booking.user === "object" ? booking.user : null;
  const pet = booking.pet && typeof booking.pet === "object" ? booking.pet : null;

  return {
    id: toRawId(booking._id || booking.id),
    bookingCode: booking.bookingCode,
    userId: user ? toRawId(user._id || user.id) : toRawId(booking.user),
    userName: user ? user.fullName || user.username || user.email || "" : "",
    petId: pet ? toLegacyNumericId(pet._id || pet.id) : null,
    petMongoId: pet ? toRawId(pet._id || pet.id) : toRawId(booking.pet),
    petName: pet ? pet.name : "",
    scheduledAt: booking.scheduledAt,
    expectedEndTime: booking.expectedEndTime,
    totalPrice: booking.totalPrice || 0,
    notes: booking.notes || "",
    bookingStatus: bookingStatusToCode[booking.bookingStatus] ?? -1,
    services: (booking.services || []).map((item) => {
      const service = item.service && typeof item.service === "object" ? item.service : null;

      return {
        id: service ? toRawId(service._id || service.id) : toRawId(item.service),
        name: service ? service.name : "",
        price: item.priceAtTime ?? (service ? service.price : 0),
        durationInMinutes: service ? service.durationInMinutes || 0 : 0,
      };
    }),
  };
}

function presentVoucher(voucher) {
  if (!voucher) return null;

  return {
    id: toRawId(voucher._id || voucher.id),
    code: voucher.code,
    amount: voucher.amount || 0,
    remainingAmount: voucher.remainingAmount || 0,
    expiredAt: voucher.expiredAt,
    status: voucher.status,
  };
}

module.exports = {
  bookingStatusToCode,
  presentBooking,
  presentPet,
  presentPetType,
  presentVoucher,
};
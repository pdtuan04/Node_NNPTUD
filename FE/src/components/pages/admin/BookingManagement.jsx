import React, { useState, useEffect } from 'react';
import { Html5QrcodeScanner, Html5QrcodeSupportedFormats } from 'html5-qrcode';

const BookingManagement = () => {
    const BACKEND_URL = 'http://localhost:8080/api/v1';

    const [bookings, setBookings] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Hàm Helper tính ngày thứ 2 đầu tuần
    function getMonday(date) {
        const d = new Date(date);
        const day = d.getDay();
        const diff = d.getDate() - day + (day === 0 ? -6 : 1);
        return new Date(d.setDate(diff));
    }

    function formatDateForInput(date) {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    const [selectedWeekStart, setSelectedWeekStart] = useState(getMonday(new Date()));
    const [selectedDate, setSelectedDate] = useState(formatDateForInput(new Date()));
    
    // Tính ngày Chủ nhật cuối tuần để hiển thị
    const endOfWeek = new Date(selectedWeekStart);
    endOfWeek.setDate(endOfWeek.getDate() + 6);
    
    // Modal states
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [showScannerModal, setShowScannerModal] = useState(false);
    const [showCreateBookingModal, setShowCreateBookingModal] = useState(false);
    const [showServiceModal, setShowServiceModal] = useState(false);
    const [showAddPetModal, setShowAddPetModal] = useState(false);
    const [showCreateConfirmModal, setShowCreateConfirmModal] = useState(false);
    const [showCreateSuccessModal, setShowCreateSuccessModal] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);

    // Data states
    const [selectedBooking, setSelectedBooking] = useState(null);
    const [toast, setToast] = useState({ show: false, message: '', type: '' });
    
    const [searchEmail, setSearchEmail] = useState('');
    const [searchingUser, setSearchingUser] = useState(false);
    const [foundUser, setFoundUser] = useState(null);
    const [userSearchError, setUserSearchError] = useState(null);
    const [isScanningAPI, setIsScanningAPI] = useState(false);

    const [isEditMode, setIsEditMode] = useState(false); 
    const [isDeleting, setIsDeleting] = useState(false); 
    const [updatingStatus, setUpdatingStatus] = useState(false); 
    const [submitting, setSubmitting] = useState(false);
    const [confirming, setConfirming] = useState(false);

    // Form states
    const [services, setServices] = useState([]);
    const [selectedServices, setSelectedServices] = useState([]);
    const [pets, setPets] = useState([]);
    const [petTypes, setPetTypes] = useState([]);
    const [selectedPet, setSelectedPet] = useState('');
    const [newBookingDate, setNewBookingDate] = useState(''); 
    const [availableSlots, setAvailableSlots] = useState([]);
    const [selectedSlot, setSelectedSlot] = useState(null);
    const [notes, setNotes] = useState('');
    const [newPet, setNewPet] = useState({ name: '', petTypeId: '', age: '' });
    const [addingPet, setAddingPet] = useState(false);
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH');
    const [newBookingResult, setNewBookingResult] = useState(null);

    const [loadingServices, setLoadingServices] = useState(false);
    const [loadingPets, setLoadingPets] = useState(false);
    const [loadingPetTypes, setLoadingPetTypes] = useState(false);
    const [loadingSlots, setLoadingSlots] = useState(false);
    
    const [serviceError, setServiceError] = useState(null);
    const [slotError, setSlotError] = useState(null);
    const [addPetError, setAddPetError] = useState(null);

    const getAuthHeaders = () => {
        const userStorage = JSON.parse(localStorage.getItem("user") || "{}");
        const token = userStorage?.token || "";
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    const showToastMsg = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: '' }), 3000);
    };

    const formatCurrency = (amount) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
    const formatDateTime = (dateTimeString) => new Date(dateTimeString).toLocaleString('vi-VN', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' });
    const formatTime = (dateTimeString) => new Date(dateTimeString).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    const getTodayDate = () => new Date().toISOString().split('T')[0];

    useEffect(() => {
        fetchBookings();
    }, [selectedWeekStart]);

    // LOAD GIỜ TRỐNG KHI ĐỔI NGÀY / DỊCH VỤ
    useEffect(() => {
        if (newBookingDate && selectedServices.length > 0) {
            fetchAvailableSlots();
        } else {
            setAvailableSlots([]);
        }
    }, [newBookingDate, selectedServices]);

    useEffect(() => {
        let scanner = null;
        if (showScannerModal) {
            scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 }, formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE] }, false);
            scanner.render(
                (decodedText) => { 
                    scanner.clear(); 
                    setShowScannerModal(false); 
                    fetchBookingByCode(decodedText); 
                },
                (error) => {}
            );
        }
        return () => { if (scanner) scanner.clear().catch(e => console.error(e)); };
    }, [showScannerModal]);

    const fetchBookings = async () => {
        try {
            setLoading(true);
            const startDate = formatDateForInput(selectedWeekStart);
            const response = await fetch(`${BACKEND_URL}/bookings/week?startDate=${startDate}`, { 
                headers: getAuthHeaders() 
            });
            if (response.ok) { 
                const result = await response.json(); 
                setBookings(result.data || result || []); 
            }
        } catch (error) { 
            showToastMsg('Không thể tải dữ liệu lịch!', 'error'); 
        } finally { 
            setLoading(false); 
        }
    };

    const handlePreviousWeek = () => { 
        const newDate = new Date(selectedWeekStart); 
        newDate.setDate(newDate.getDate() - 7); 
        setSelectedWeekStart(newDate); 
        setSelectedDate(formatDateForInput(newDate)); 
    };
    const handleNextWeek = () => { 
        const newDate = new Date(selectedWeekStart); 
        newDate.setDate(newDate.getDate() + 7); 
        setSelectedWeekStart(newDate); 
        setSelectedDate(formatDateForInput(newDate)); 
    };
    const handleToday = () => { 
        const today = new Date(); 
        setSelectedWeekStart(getMonday(today)); 
        setSelectedDate(formatDateForInput(today)); 
    };
    const handleDateChange = (e) => { 
        const val = e.target.value; 
        if(!val) return;
        setSelectedDate(val); 
        const [y, m, d] = val.split('-'); 
        setSelectedWeekStart(getMonday(new Date(y, m - 1, d))); 
    };

    const handleSearchUser = async (e) => {
        e.preventDefault();
        if (!searchEmail) return;
        try {
            setSearchingUser(true); setUserSearchError(null); setFoundUser(null);
            const response = await fetch(`${BACKEND_URL}/users/search?email=${searchEmail}`, {
                headers: getAuthHeaders()
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                setFoundUser(result.data); 
                showToastMsg(`Tìm khách hàng: ${result.data.username}`, 'success');
            } else {
                throw new Error(result.message || 'Không tìm thấy khách hàng!');
            }
        } catch (err) { 
            setUserSearchError(err.message); 
        } finally { 
            setSearchingUser(false); 
        }
    };

    const fetchBookingByCode = async (code) => {
        try {
            setIsScanningAPI(true);
            const response = await fetch(`${BACKEND_URL}/bookings/code/${code}`, { headers: getAuthHeaders() });
            const result = await response.json();
            
            if (response.ok && result.success && result.data) {
                setSelectedBooking(result.data); 
                setShowDetailModal(true); 
                showToastMsg('Quét mã thành công!', 'success');
            } else {
                throw new Error(result.message || 'Không tìm thấy lịch hẹn!');
            }
        } catch (err) { 
            showToastMsg(err.message, 'error'); 
        } finally { 
            setIsScanningAPI(false); 
        }
    };

    const handleBookingClick = async (booking) => {
        setSelectedBooking(booking);
        setShowDetailModal(true);
    };

    const handleUpdateStatus = async (action) => {
        try {
            setUpdatingStatus(true);
            const response = await fetch(`${BACKEND_URL}/bookings/${selectedBooking._id || selectedBooking.id}/${action}`, { 
                method: 'PUT', 
                headers: getAuthHeaders() 
            });
            const result = await response.json();
            
            if (response.ok) {
                showToastMsg(`Cập nhật trạng thái thành công!`, 'success');
                setShowDetailModal(false); 
                fetchBookings(); 
            } else {
                throw new Error(result.message || 'Cập nhật thất bại');
            }
        } catch (err) { 
            showToastMsg(err.message, 'error'); 
        } finally { 
            setUpdatingStatus(false); 
        }
    };

    const handlePaymentConfirm = async () => {
        try {
            setUpdatingStatus(true);
            const response = await fetch(`${BACKEND_URL}/bookings/${selectedBooking._id || selectedBooking.id}/complete`, { 
                method: 'PUT', 
                headers: getAuthHeaders(),
                body: JSON.stringify({ paymentMethod: selectedPaymentMethod })
            });
            const result = await response.json();
            
            if (response.ok) {
                showToastMsg('Đã chốt doanh thu và hoàn tất lịch hẹn!', 'success');
                setShowPaymentModal(false);
                setShowDetailModal(false);
                fetchBookings();
            } else {
                throw new Error(result.message);
            }
        } catch (err) {
            showToastMsg('Lỗi thanh toán: ' + err.message, 'error');
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleDeleteBooking = async () => {
        if (!window.confirm('Bạn có chắc chắn muốn HỦY/XÓA lịch hẹn này không?')) return;
        try {
            setIsDeleting(true);
            const response = await fetch(`${BACKEND_URL}/bookings/${selectedBooking._id || selectedBooking.id}`, { 
                method: 'DELETE', 
                headers: getAuthHeaders() 
            });
            if (response.ok) {
                showToastMsg('Đã xóa thành công', 'success'); 
                setShowDetailModal(false); 
                fetchBookings(); 
            } else {
                const result = await response.json();
                throw new Error(result.message);
            }
        } catch (err) { 
            showToastMsg(err.message || 'Lỗi khi xóa', 'error'); 
        } finally { 
            setIsDeleting(false); 
        }
    };

    const fetchUserPets = async (userId) => {
        try {
            setLoadingPets(true); 
            const response = await fetch(`${BACKEND_URL}/pets/user/${userId}`, { headers: getAuthHeaders() });
            const result = await response.json();
            if (response.ok) setPets(result.data || result);
        } catch (err) { } finally { setLoadingPets(false); }
    };

    const fetchPetTypes = async () => {
        try {
            setLoadingPetTypes(true);
            const response = await fetch(`${BACKEND_URL}/pet-types`, { headers: getAuthHeaders() });
            const result = await response.json();
            if (response.ok) setPetTypes(result.data || result);
        } catch (err) { } finally { setLoadingPetTypes(false); }
    };

    const fetchServicesByPetType = async (petTypeId) => {
        try {
            setLoadingServices(true); setServiceError(null);
            const response = await fetch(`${BACKEND_URL}/services/pet-type/${petTypeId}`, { headers: getAuthHeaders() });
            if (!response.ok) throw new Error('Không tải được dịch vụ.');
            const data = await response.json();
            setServices(data.data || data); 
        } catch (err) { 
            setServiceError(err.message); 
            setServices([]); 
        } finally { 
            setLoadingServices(false); 
        }
    };

    // HÀM FETCH GIỜ TRỐNG - ĐÃ SỬA LỖI MẤT SLOT KHI EDIT
    const fetchAvailableSlots = async () => {
        try {
            setLoadingSlots(true); setSlotError(null);
            const totalDuration = selectedServices.reduce((sum, service) => sum + service.durationInMinutes, 0);
            const response = await fetch(`${BACKEND_URL}/bookings/available-slots?date=${newBookingDate}&duration=${totalDuration}`, { headers: getAuthHeaders() });
            const result = await response.json();
            
            if (response.ok) {
                let slots = result.data || result || [];
                
                // MẸO: Nếu đang Edit và cùng 1 ngày, Backend sẽ không trả về giờ cũ (vì nó tưởng khách khác định đặt)
                // Mình phải tự nhét cái Slot cũ vào danh sách cho chọn
                if (isEditMode && selectedBooking) {
                    const oldDateStr = formatDateForInput(new Date(selectedBooking.scheduledAt));
                    if (newBookingDate === oldDateStr) {
                        const oldTime = new Date(selectedBooking.scheduledAt).getTime();
                        const exists = slots.some(s => new Date(s.startAt).getTime() === oldTime);
                        if (!exists) {
                            slots.push({ startAt: selectedBooking.scheduledAt });
                            slots.sort((a, b) => new Date(a.startAt) - new Date(b.startAt));
                        }
                    }
                }
                setAvailableSlots(slots);
            } else {
                throw new Error(result.message);
            }
        } catch (err) { 
            setSlotError(err.message); 
            setAvailableSlots([]); 
        } finally { 
            setLoadingSlots(false); 
        }
    };

    const handlePetChange = (e) => {
        const pId = e.target.value;
        setSelectedPet(pId);
        setSelectedServices([]); 
        setSelectedSlot(null);   
        
        if (pId) {
            const pet = pets.find(p => String(p._id || p.id) === String(pId));
            if (pet && pet.petType) {
                const typeId = pet.petType._id || pet.petType.id || pet.petType;
                fetchServicesByPetType(typeId);
            }
        } else {
            setServices([]);
        }
    };

    const handleOpenCreateBooking = () => {
        setIsEditMode(false);
        setShowCreateBookingModal(true);
        fetchUserPets(foundUser._id || foundUser.id);
        setServices([]);
        setSelectedServices([]); setSelectedPet(''); setNewBookingDate(''); setSelectedSlot(null); setNotes('');
    };

    const handleOpenAddPetModal = () => { 
        setShowAddPetModal(true); 
        fetchPetTypes(); 
    };

    // HÀM MỞ MODAL SỬA - ĐÃ FIX LỖI LOAD DATA CŨ
    const handleOpenEditBooking = async () => {
        setIsEditMode(true);
        setShowDetailModal(false);
        
        let userId = selectedBooking.user?._id || selectedBooking.user?.id;
        // Đổ thông tin khách
        setFoundUser({ id: userId, username: selectedBooking.user?.username, email: selectedBooking.user?.email });
        
        try {
            // 1. Tải danh sách pet
            const petsRes = await fetch(`${BACKEND_URL}/pets/user/${userId}`, { headers: getAuthHeaders() });
            const petsData = await petsRes.json();
            const allPets = petsData.data || petsData || [];
            setPets(allPets);

            // 2. Chọn Pet cũ
            let petId = selectedBooking.pet?._id || selectedBooking.pet?.id;
            setSelectedPet(petId);

            // 3. Tải danh sách dịch vụ của Pet đó
            const currentPet = allPets.find(p => String(p._id || p.id) === String(petId));
            if (currentPet && currentPet.petType) {
                const typeId = currentPet.petType._id || currentPet.petType.id || currentPet.petType;
                const srvRes = await fetch(`${BACKEND_URL}/services/pet-type/${typeId}`, { headers: getAuthHeaders() });
                const srvData = await srvRes.json();
                setServices(srvData.data || srvData || []);
            }
            
            // 4. Ghi chú
            setNotes(selectedBooking.notes || '');
            
            // 5. Fix lỗi ngày bị lệch múi giờ
            const localDate = new Date(selectedBooking.scheduledAt);
            setNewBookingDate(formatDateForInput(localDate));
            
            // 6. Nhặt ra mảng Dịch Vụ Cũ
            if (selectedBooking.services) {
                const prefilledServices = selectedBooking.services.map(s => s.service);
                setSelectedServices(prefilledServices);
            }
            
            // 7. Chọn lại slot cũ
            setSelectedSlot({ startAt: selectedBooking.scheduledAt });
            
            setShowCreateBookingModal(true);
        } catch (err) {
            showToastMsg('Lỗi khi tải dữ liệu cũ: ' + err.message, 'error');
        }
    };

    const handleAddPet = async (e) => {
        e.preventDefault();
        try {
            setAddingPet(true); setAddPetError(null);
            const response = await fetch(`${BACKEND_URL}/pets`, {
                method: 'POST', 
                headers: getAuthHeaders(),
                body: JSON.stringify({ name: newPet.name, petType: newPet.petTypeId, age: parseInt(newPet.age), user: foundUser._id || foundUser.id })
            });
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            setNewPet({ name: '', petTypeId: '', age: '' });
            await fetchUserPets(foundUser._id || foundUser.id);
            setShowAddPetModal(false);
        } catch (err) { 
            setAddPetError(err.message); 
        } finally { 
            setAddingPet(false); 
        }
    };

    const handleSubmitBooking = async () => {
        if (!selectedPet || selectedServices.length === 0 || !selectedSlot) {
            alert('Vui lòng điền đầy đủ thông tin!'); return;
        }
        try {
            setSubmitting(true);
            const url = isEditMode ? `${BACKEND_URL}/bookings/${selectedBooking._id || selectedBooking.id}` : `${BACKEND_URL}/bookings`;
            const method = isEditMode ? 'PUT' : 'POST';

            const formattedScheduleTime = new Date(selectedSlot.startAt).toISOString();

            const response = await fetch(url, {
                method: method, 
                headers: getAuthHeaders(),
                body: JSON.stringify({ 
                    userId: foundUser._id || foundUser.id,
                    scheduledAt: formattedScheduleTime, 
                    notes: notes || "", 
                    petId: selectedPet, 
                    services: selectedServices.map(s => s._id || s.id) 
                })
            });
            
            const result = await response.json();
            if (!response.ok) throw new Error(result.message);
            
            setNewBookingResult(result.data || result);
            setShowCreateConfirmModal(true);
        } catch (err) { 
            alert('Lỗi: ' + err.message); 
        } finally { 
            setSubmitting(false); 
        }
    };

    const handleConfirmBooking = async () => {
        try {
            setConfirming(true);
            const response = await fetch(`${BACKEND_URL}/bookings/${newBookingResult._id || newBookingResult.id}/confirm`, { 
                method: 'PUT',
                headers: getAuthHeaders()
            });
            
            if (!response.ok) throw new Error("Lỗi xác nhận");
            
            setShowCreateConfirmModal(false);
            setShowCreateBookingModal(false); 
            setShowCreateSuccessModal(true);
            fetchBookings(); 
        } catch (err) { 
            alert('Lỗi xác nhận: ' + err.message); 
        } finally { 
            setConfirming(false); 
        }
    };

    const getBookingStatusText = (status) => {
        const statusMap = { 'PENDING': 'Chờ xử lý', 'PENDING_PAYMENT': 'Chờ thanh toán', 'CONFIRMED': 'Đã xác nhận', 'IN_PROGRESS': 'Đang thực hiện', 'COMPLETED': 'Hoàn thành', 'CANCELLED': 'Đã hủy', 'NO_SHOW': 'Khách vắng' };
        return statusMap[status] || status;
    };

    const getBookingStatusColor = (status) => {
        const colorMap = { 'PENDING': 'bg-warning text-dark', 'PENDING_PAYMENT': 'bg-info text-white', 'CONFIRMED': 'bg-primary text-white', 'IN_PROGRESS': 'bg-info text-white', 'COMPLETED': 'bg-success text-white', 'CANCELLED': 'bg-secondary text-white', 'NO_SHOW': 'bg-danger text-white' };
        return colorMap[status] || 'bg-dark';
    };

    const toggleServiceSelection = (service) => {
        setSelectedSlot(null); // Đổi dịch vụ phải bắt chọn lại giờ
        const isSelected = selectedServices.find(s => (s._id || s.id) === (service._id || service.id));
        if (isSelected) setSelectedServices(selectedServices.filter(s => (s._id || s.id) !== (service._id || service.id)));
        else setSelectedServices([...selectedServices, service]);
    };
    
    const isServiceSelected = (serviceId) => selectedServices.some(s => (s._id || s.id) === serviceId);
    
    const handleRemoveService = (serviceId) => {
        setSelectedSlot(null); // Xóa dịch vụ phải bắt chọn lại giờ
        setSelectedServices(selectedServices.filter(s => (s._id || s.id) !== serviceId));
    };

    return (
        <div className="container-fluid px-4">
            {toast.show && (
                <div className="position-fixed top-0 end-0 p-3" style={{ zIndex: 9999 }}>
                    <div className={`alert alert-${toast.type === 'success' ? 'success' : 'danger'} alert-dismissible fade show`}>
                        <i className={`fas fa-${toast.type === 'success' ? 'check-circle' : 'exclamation-circle'} me-2`}></i>
                        {toast.message}
                        <button type="button" className="btn-close" onClick={() => setToast({ show: false, message: '', type: '' })}></button>
                    </div>
                </div>
            )}

            <h1 className="mt-4 mb-4">Quản lý Đặt lịch</h1>
            
            <div className="row mb-4">
                {/* TẠO LỊCH MỚI */}
                <div className="col-md-8 mb-3 mb-md-0">
                    <div className="card shadow-sm border-primary h-100">
                        <div className="card-header bg-white fw-bold">
                            <i className="fas fa-plus-circle text-primary me-2"></i>Tạo Lịch Hẹn Mới
                        </div>
                        <div className="card-body">
                            <form onSubmit={handleSearchUser} className="d-flex gap-2 mb-3">
                                <input type="email" className="form-control" placeholder="Nhập email khách hàng để tạo lịch..." value={searchEmail} onChange={(e) => setSearchEmail(e.target.value)} required />
                                <button type="submit" className="btn btn-primary px-4" disabled={searchingUser}>
                                    {searchingUser ? <span className="spinner-border spinner-border-sm"></span> : 'Tìm Khách Hàng'}
                                </button>
                            </form>
                            {userSearchError && <div className="text-danger small">{userSearchError}</div>}
                            
                            {foundUser && (
                                <div className="alert alert-success d-flex justify-content-between align-items-center mb-0 p-2">
                                    <div>
                                        <strong>{foundUser.username}</strong> ({foundUser.email})
                                    </div>
                                    <button className="btn btn-success btn-sm fw-bold" onClick={handleOpenCreateBooking}>
                                        Tiếp tục tạo lịch <i className="fas fa-arrow-right ms-1"></i>
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* QUÉT QR */}
                <div className="col-md-4">
                    <div className="card shadow-sm border-success h-100">
                        <div className="card-header bg-white fw-bold">
                            <i className="fas fa-qrcode text-success me-2"></i>Quét mã QR Hóa Đơn
                        </div>
                        <div className="card-body d-flex flex-column align-items-center justify-content-center">
                            <button type="button" className="btn btn-success w-100 py-3 fw-bold" onClick={() => setShowScannerModal(true)}>
                                <i className="fas fa-camera fa-lg me-2"></i> Bấm để Mở Camera
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* THANH CÔNG CỤ CHỌN TUẦN ĐƠN GIẢN */}
            <div className="d-flex flex-column flex-md-row justify-content-between align-items-center mb-3 bg-white p-3 rounded shadow-sm border">
                <div className="d-flex gap-2 mb-2 mb-md-0">
                    <button className="btn btn-outline-secondary btn-sm" onClick={handlePreviousWeek}>
                        <i className="fas fa-chevron-left me-1"></i> Tuần trước
                    </button>
                    <button className="btn btn-primary btn-sm fw-bold" onClick={handleToday}>
                        Tuần Hiện Tại
                    </button>
                    <button className="btn btn-outline-secondary btn-sm" onClick={handleNextWeek}>
                        Tuần sau <i className="fas fa-chevron-right ms-1"></i>
                    </button>
                </div>
                <div className="d-flex align-items-center gap-3">
                    <div className="fw-bold text-primary text-center">
                        {selectedWeekStart.toLocaleDateString('vi-VN')} <i className="fas fa-arrow-right text-muted mx-2"></i> {endOfWeek.toLocaleDateString('vi-VN')}
                    </div>
                    <input type="date" className="form-control form-control-sm border-primary" value={selectedDate} onChange={handleDateChange} style={{ maxWidth: '150px' }} />
                </div>
            </div>

            {/* BẢNG DANH SÁCH LỊCH HẸN */}
            <div className="card shadow-sm mb-4">
                <div className="card-header bg-dark text-white fw-bold d-flex justify-content-between align-items-center">
                    <span><i className="fas fa-list me-2"></i>Danh sách Lịch hẹn trong tuần</span>
                    <button className="btn btn-sm btn-light" onClick={fetchBookings}>
                        <i className="fas fa-sync-alt me-1"></i> Làm mới
                    </button>
                </div>
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5"><div className="spinner-border text-primary" role="status"></div></div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-5 text-muted">Chưa có lịch hẹn nào trong tuần này.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                                <thead className="table-light">
                                    <tr>
                                        <th>Mã Hóa Đơn</th>
                                        <th>Khách hàng</th>
                                        <th>Thú cưng</th>
                                        <th>Thời gian đặt</th>
                                        <th>Tổng tiền</th>
                                        <th>Trạng thái</th>
                                        <th className="text-center">Thao tác</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {bookings.map((booking) => (
                                        <tr key={booking._id || booking.id}>
                                            <td className="fw-bold text-primary">{booking.bookingCode}</td>
                                            <td>{booking.user?.username || 'Khách vãng lai'}</td>
                                            <td>{booking.pet?.name || 'Chưa rõ'}</td>
                                            <td>
                                                <div className="fw-bold">{formatTime(booking.scheduledAt)}</div>
                                                <div className="small text-muted">{new Date(booking.scheduledAt).toLocaleDateString('vi-VN')}</div>
                                            </td>
                                            <td className="fw-bold text-danger">{formatCurrency(booking.totalPrice || 0)}</td>
                                            <td>
                                                <span className={`badge ${getBookingStatusColor(booking.bookingStatus)}`}>
                                                    {getBookingStatusText(booking.bookingStatus)}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-info" onClick={() => handleBookingClick(booking)}>
                                                    <i className="fas fa-eye"></i> Xem / Xử lý
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL CHI TIẾT BOOKING */}
            {showDetailModal && selectedBooking && (
                <div className="modal fade show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-lg">
                        <div className="modal-content border-0 shadow">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold"><i className="fas fa-file-invoice me-2 text-primary"></i>Hóa đơn: {selectedBooking.bookingCode}</h5>
                                <button type="button" className="btn-close" onClick={() => setShowDetailModal(false)}></button>
                            </div>
                            <div className="modal-body">
                                <div className="row mb-3">
                                    <div className="col-md-6">
                                        <p className="mb-1 text-muted small">Thông tin Khách</p>
                                        <div className="fw-bold fs-5">{selectedBooking.user?.username}</div>
                                        <div><i className="fas fa-paw me-2 text-warning"></i>{selectedBooking.pet?.name}</div>
                                    </div>
                                    <div className="col-md-6 text-md-end mt-3 mt-md-0">
                                        <p className="mb-1 text-muted small">Trạng thái</p>
                                        <span className={`badge fs-6 ${getBookingStatusColor(selectedBooking.bookingStatus)}`}>
                                            {getBookingStatusText(selectedBooking.bookingStatus)}
                                        </span>
                                        <div className="mt-2 text-muted"><i className="far fa-clock me-1"></i>{formatDateTime(selectedBooking.scheduledAt)}</div>
                                    </div>
                                </div>
                                
                                <div className="border rounded p-3 bg-light mb-3">
                                    <h6 className="fw-bold mb-3 border-bottom pb-2">Danh sách Dịch vụ</h6>
                                    {selectedBooking.services?.map((s, index) => (
                                        <div key={index} className="d-flex justify-content-between align-items-center mb-2">
                                            <span>{s.service?.name}</span>
                                            <span className="fw-bold">{formatCurrency(s.priceAtTime || 0)}</span>
                                        </div>
                                    ))}
                                    <div className="d-flex justify-content-between align-items-center border-top pt-2 mt-2">
                                        <span className="fw-bold fs-5 text-uppercase">Tổng Cần Thu:</span>
                                        <span className="fw-bold fs-4 text-danger">{formatCurrency(selectedBooking.totalPrice)}</span>
                                    </div>
                                </div>

                                {selectedBooking.notes && (
                                    <div className="alert alert-warning py-2 mb-0">
                                        <strong>Ghi chú:</strong> {selectedBooking.notes}
                                    </div>
                                )}
                            </div>
                            <div className="modal-footer bg-light justify-content-between">
                                <div>
                                    {['PENDING', 'PENDING_PAYMENT', 'CONFIRMED'].includes(selectedBooking.bookingStatus) && (
                                        <>
                                            <button className="btn btn-outline-danger me-2" onClick={handleDeleteBooking} disabled={isDeleting}>Hủy Hóa đơn</button>
                                            <button className="btn btn-outline-secondary" onClick={handleOpenEditBooking}>Sửa Hóa đơn</button>
                                        </>
                                    )}
                                </div>
                                <div className="d-flex gap-2">
                                    {['PENDING', 'PENDING_PAYMENT'].includes(selectedBooking.bookingStatus) && (
                                        <button className="btn btn-primary fw-bold" onClick={() => handleUpdateStatus('confirm')} disabled={updatingStatus}>1. Xác nhận & Gửi QR</button>
                                    )}
                                    {selectedBooking.bookingStatus === 'CONFIRMED' && (
                                        <button className="btn btn-info fw-bold text-white" onClick={() => handleUpdateStatus('start')} disabled={updatingStatus}>2. Khách check-in (Bắt đầu làm)</button>
                                    )}
                                    {selectedBooking.bookingStatus === 'IN_PROGRESS' && (
                                        <button className="btn btn-success fw-bold" onClick={() => setShowPaymentModal(true)} disabled={updatingStatus}>3. Hoàn thành & Thu tiền</button>
                                    )}
                                    <button className="btn btn-dark" onClick={() => setShowDetailModal(false)}>Đóng</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL QUÉT QR */}
            {showScannerModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.8)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0 overflow-hidden">
                            <div className="modal-header bg-dark text-white border-0">
                                <h5 className="modal-title"><i className="fas fa-qrcode me-2"></i>Quét mã QR Hóa đơn</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowScannerModal(false)}></button>
                            </div>
                            <div className="modal-body p-0 bg-dark text-center position-relative">
                                <div id="reader" style={{ width: '100%', minHeight: '300px' }}></div>
                                <div className="position-absolute bottom-0 w-100 p-3 bg-dark bg-opacity-75">
                                    <p className="text-white mb-0 small">Đưa mã QR trên điện thoại của khách vào giữa khung hình.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHỌN HÌNH THỨC THANH TOÁN */}
            {showPaymentModal && selectedBooking && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1070 }}>
                    <div className="modal-dialog modal-sm modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-success text-white">
                                <h6 className="modal-title fw-bold">Xác nhận Thu tiền</h6>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowPaymentModal(false)}></button>
                            </div>
                            <div className="modal-body text-center p-4">
                                <h3 className="text-danger fw-bold mb-3">{formatCurrency(selectedBooking.totalPrice)}</h3>
                                <select className="form-select border-success fw-bold text-center" value={selectedPaymentMethod} onChange={(e) => setSelectedPaymentMethod(e.target.value)}>
                                    <option value="CASH">💵 Thu Tiền mặt</option>
                                    <option value="MOMO_PREPAID">📱 Khách chuyển Momo</option>
                                    <option value="VNPAY_PREPAID">🏦 Khách chuyển Khoản</option>
                                </select>
                            </div>
                            <div className="modal-footer p-2 justify-content-center bg-light">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowPaymentModal(false)}>Hủy</button>
                                <button type="button" className="btn btn-success px-4 fw-bold" onClick={handlePaymentConfirm} disabled={updatingStatus}>
                                    Chốt Sổ
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL TẠO LỊCH HẸN */}
            {showCreateBookingModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 1040, overflowY: 'auto' }}>
                    <div className="modal-dialog modal-lg modal-dialog-scrollable">
                        <div className="modal-content shadow-lg border-0">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="mb-0 fw-bold">
                                    <i className="fas fa-calendar-plus me-2"></i>
                                    {isEditMode ? `Sửa Lịch: ${foundUser?.username}` : `Tạo Lịch: ${foundUser?.username}`}
                                </h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowCreateBookingModal(false)}></button>
                            </div>
                            <div className="modal-body bg-light p-4">
                                <div className="card border-0 shadow-sm">
                                    <div className="card-body p-4">
                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary">1. Chọn thú cưng <span className="text-danger">*</span></label>
                                            {loadingPets ? (
                                                <div className="spinner-border spinner-border-sm text-primary ms-3"></div>
                                            ) : pets.length === 0 ? (
                                                <div className="alert alert-warning py-2">Khách hàng chưa có thú cưng. <button type="button" className="btn btn-sm btn-dark ms-2" onClick={handleOpenAddPetModal}>Thêm ngay</button></div>
                                            ) : (
                                                <div className="d-flex gap-2">
                                                    <select className="form-select" value={selectedPet} onChange={handlePetChange}>
                                                        <option value="">-- Chọn thú cưng --</option>
                                                        {pets.map(pet => <option key={pet._id || pet.id} value={pet._id || pet.id}>{pet.name} ({pet.age} tuổi)</option>)}
                                                    </select>
                                                    <button type="button" className="btn btn-outline-dark text-nowrap" onClick={handleOpenAddPetModal}>+ Thêm mới</button>
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary">2. Dịch vụ Spa <span className="text-danger">*</span></label>
                                            {!selectedPet ? (
                                                <div className="text-muted small fst-italic">Vui lòng chọn Thú cưng trước.</div>
                                            ) : (
                                                <div>
                                                    <button type="button" className="btn btn-primary btn-sm" onClick={() => setShowServiceModal(true)}>+ Bấm để Chọn dịch vụ</button>
                                                </div>
                                            )}
                                            {selectedServices.length > 0 && (
                                                <div className="d-flex flex-wrap gap-2 mt-2 p-2 bg-light rounded border">
                                                    {selectedServices.map(service => (
                                                        <span key={service._id || service.id} className="badge bg-primary d-flex align-items-center gap-2 p-2">
                                                            {service.name} <button type="button" className="btn-close btn-close-white" onClick={() => handleRemoveService(service._id || service.id)}></button>
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>

                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary">3. Chọn ngày <span className="text-danger">*</span></label>
                                            {/* Fix lỗi DatePicker chặn quá khứ nếu đang ở EditMode */}
                                            <input type="date" className="form-control" value={newBookingDate} min={isEditMode ? "" : getTodayDate()} onChange={(e) => { setNewBookingDate(e.target.value); setSelectedSlot(null); }} disabled={selectedServices.length === 0} />
                                        </div>

                                        {newBookingDate && selectedServices.length > 0 && (
                                            <div className="mb-4 p-3 border rounded bg-white">
                                                <label className="form-label fw-bold text-secondary">4. Chọn khung giờ trống <span className="text-danger">*</span></label>
                                                {loadingSlots ? (
                                                    <div className="text-center py-2"><span className="spinner-border spinner-border-sm text-primary"></span></div>
                                                ) : availableSlots.length === 0 ? (
                                                    <div className="alert alert-secondary py-2 mb-0">Không còn khung giờ trống.</div>
                                                ) : (
                                                    <div className="row g-2">
                                                        {availableSlots.map((slot, index) => {
                                                            const isSelected = selectedSlot && new Date(selectedSlot.startAt).getTime() === new Date(slot.startAt).getTime();
                                                            return (
                                                                <div key={index} className="col-md-3 col-4">
                                                                    <button type="button" className={`btn w-100 fw-bold ${isSelected ? 'btn-primary' : 'btn-outline-primary bg-white'}`} onClick={() => setSelectedSlot(slot)}>
                                                                        {formatTime(slot.startAt)}
                                                                    </button>
                                                                </div>
                                                            )
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        <div className="mb-4">
                                            <label className="form-label fw-bold text-secondary">Ghi chú thêm</label>
                                            <textarea className="form-control" rows="2" value={notes} onChange={(e) => setNotes(e.target.value)}></textarea>
                                        </div>

                                        <div className="d-grid mt-4">
                                            <button type="button" className="btn btn-success btn-lg fw-bold text-white" onClick={handleSubmitBooking} disabled={!selectedPet || selectedServices.length === 0 || !selectedSlot || submitting}>
                                                {submitting ? 'Đang xử lý...' : (isEditMode ? 'LƯU CẬP NHẬT' : 'TẠO LỊCH NGAY')}
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL CHỌN DỊCH VỤ */}
            {showServiceModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-lg modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-light">
                                <h5 className="modal-title fw-bold">Chọn dịch vụ</h5>
                                <button type="button" className="btn-close" onClick={() => setShowServiceModal(false)}></button>
                            </div>
                            <div className="modal-body p-0">
                                {loadingServices ? (
                                    <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
                                ) : serviceError ? (
                                    <div className="alert alert-danger m-3">{serviceError}</div>
                                ) : services.length === 0 ? (
                                    <div className="alert alert-warning m-3">Không có dịch vụ nào phù hợp với thú cưng này.</div>
                                ) : (
                                    <table className="table table-hover mb-0 align-middle">
                                        <thead className="table-light"><tr><th className="ps-4">Chọn</th><th>Tên dịch vụ</th><th>Giá</th><th>Thời lượng</th></tr></thead>
                                        <tbody>
                                            {services.map(service => (
                                                <tr key={service._id || service.id} onClick={() => toggleServiceSelection(service)} style={{ cursor: 'pointer' }}>
                                                    <td className="ps-4"><input type="checkbox" className="form-check-input" checked={isServiceSelected(service._id || service.id)} readOnly /></td>
                                                    <td className="fw-bold">{service.name}</td>
                                                    <td className="text-danger fw-bold">{service.price.toLocaleString('vi-VN')}đ</td>
                                                    <td>{service.durationInMinutes} phút</td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                            <div className="modal-footer bg-light">
                                <button type="button" className="btn btn-primary px-4 fw-bold" onClick={() => setShowServiceModal(false)}>Xong ({selectedServices.length})</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÊM PET */}
            {showAddPetModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content">
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">Thêm Thú cưng</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowAddPetModal(false)}></button>
                            </div>
                            <form onSubmit={handleAddPet}>
                                <div className="modal-body">
                                    {addPetError && <div className="alert alert-danger py-2">{addPetError}</div>}
                                    <div className="mb-3"><label className="form-label fw-bold">Tên Pet *</label><input type="text" className="form-control" value={newPet.name} onChange={(e) => setNewPet({ ...newPet, name: e.target.value })} required /></div>
                                    <div className="mb-3">
                                        <label className="form-label fw-bold">Chủng loại *</label>
                                        <select className="form-select" value={newPet.petTypeId} onChange={(e) => setNewPet({ ...newPet, petTypeId: e.target.value })} required>
                                            <option value="">-- Chọn loại --</option>
                                            {petTypes.map(type => <option key={type._id || type.id} value={type._id || type.id}>{type.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3"><label className="form-label fw-bold">Tuổi *</label><input type="number" className="form-control" min="0" max="30" value={newPet.age} onChange={(e) => setNewPet({ ...newPet, age: e.target.value })} required /></div>
                                </div>
                                <div className="modal-footer"><button type="button" className="btn btn-secondary" onClick={() => setShowAddPetModal(false)}>Hủy</button><button type="submit" className="btn btn-primary" disabled={addingPet}>{addingPet ? 'Đang lưu...' : 'Lưu thú cưng'}</button></div>
                            </form>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL XÁC NHẬN CHỐT LỊCH */}
            {showCreateConfirmModal && newBookingResult && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content border-0 shadow-lg">
                            <div className="modal-header bg-warning">
                                <h5 className="modal-title fw-bold text-dark"><i className="fas fa-exclamation-triangle me-2"></i>Xác nhận Thông tin</h5>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <h4 className="text-primary mb-3">{newBookingResult.bookingCode}</h4>
                                <p className="mb-1">Khách hàng: <strong>{foundUser?.username}</strong></p>
                                <p className="mb-1">Thời gian: <strong>{formatDateTime(newBookingResult.scheduledAt)}</strong></p>
                                <hr />
                                <h3 className="text-danger fw-bold">{newBookingResult.totalPrice.toLocaleString('vi-VN')}đ</h3>
                            </div>
                            <div className="modal-footer justify-content-center bg-light">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowCreateConfirmModal(false)}>Hủy</button>
                                <button type="button" className="btn btn-success px-4 fw-bold" onClick={handleConfirmBooking} disabled={confirming}>
                                    {confirming ? 'Đang lưu...' : 'LƯU & TẠO LỊCH'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* MODAL THÀNH CÔNG */}
            {showCreateSuccessModal && (
                <div className="modal show d-block" tabIndex="-1" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1060 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content text-center py-4 border-0 shadow-lg">
                            <div className="modal-body">
                                <i className="fas fa-check-circle text-success" style={{ fontSize: '4rem' }}></i>
                                <h4 className="mt-3 mb-1 fw-bold text-success">Thành công!</h4>
                                <button type="button" className="btn btn-outline-success mt-3 px-4 fw-bold" onClick={() => setShowCreateSuccessModal(false)}>Đóng</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BookingManagement;
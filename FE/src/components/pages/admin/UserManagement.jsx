import React, { useState, useEffect } from 'react';

const UserManagement = () => {
    const BACKEND_URL = 'http://localhost:8080/api/v1';

    const [users, setUsers] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [selectedRoleId, setSelectedRoleId] = useState('');
    const getAuthHeaders = () => {
        const userStorage = JSON.parse(localStorage.getItem("user") || "{}");
        const token = userStorage?.token || "";
        return {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
        };
    };

    useEffect(() => {
        fetchUsers();
        fetchRoles();
    }, []);
    const fetchUsers = async () => {
        setLoading(true);
        try {
            const response = await fetch(`${BACKEND_URL}/users`, { headers: getAuthHeaders() });
            if (response.ok) {
                const result = await response.json();
                setUsers(result.data || result || []);
            }
        } catch (error) {
            alert('Lỗi khi tải danh sách người dùng!');
        }
        setLoading(false);
    };
    const fetchRoles = async () => {
        try {
            const response = await fetch(`${BACKEND_URL}/roles`, { headers: getAuthHeaders() });
            if (response.ok) {
                const result = await response.json();
                setRoles(result.data || result || []);
            }
        } catch (error) {
            console.log('Lỗi tải roles:', error);
        }
    };
    const handleOpenModal = (user) => {
        setSelectedUser(user);
        let currentRoleId = user.role?._id || user.role?.id || '';
        setSelectedRoleId(currentRoleId);
        setShowModal(true);
    };
    const handleSaveRole = async () => {
        if (!selectedRoleId) return alert("Vui lòng chọn 1 quyền!");
        
        try {
            const userId = selectedUser._id || selectedUser.id;
            const response = await fetch(`${BACKEND_URL}/users/${userId}/role`, {
                method: 'PUT',
                headers: getAuthHeaders(),
                body: JSON.stringify({ roleId: selectedRoleId })
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Cập nhật quyền thành công!');
                setShowModal(false);
                fetchUsers(); 
            } else {
                alert(result.message || 'Cập nhật thất bại');
            }
        } catch (err) {
            alert('Lỗi: ' + err.message);
        }
    };

    return (
        <div className="container-fluid px-4 mt-4">
            <h2 className="mb-4"><i className="fas fa-users me-2 text-primary"></i>Quản lý Người dùng</h2>

            {/* BẢNG NGƯỜI DÙNG */}
            <div className="card shadow-sm">
                <div className="card-body p-0">
                    {loading ? (
                        <div className="text-center py-5"><span className="spinner-border text-primary"></span></div>
                    ) : (
                        <table className="table table-hover align-middle mb-0">
                            <thead className="table-light">
                                <tr>
                                    <th className="ps-3">Tên đăng nhập</th>
                                    <th>Email</th>
                                    <th>Quyền hiện tại</th>
                                    <th className="text-center">Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.length === 0 ? (
                                    <tr><td colSpan="4" className="text-center py-4">Chưa có người dùng nào.</td></tr>
                                ) : (
                                    users.map(user => (
                                        <tr key={user._id || user.id}>
                                            <td className="ps-3 fw-bold">{user.username}</td>
                                            <td>{user.email}</td>
                                            <td>
                                                <span className={`badge ${user.role?.name === 'ADMIN' ? 'bg-danger' : 'bg-secondary'}`}>
                                                    {user.role?.name || 'Chưa có quyền'}
                                                </span>
                                            </td>
                                            <td className="text-center">
                                                <button className="btn btn-sm btn-outline-primary fw-bold" onClick={() => handleOpenModal(user)}>
                                                    <i className="fas fa-user-edit me-1"></i> Đổi Quyền
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>

            {/* MODAL ĐỔI QUYỀN */}
            {showModal && selectedUser && (
                <div className="modal show d-block" style={{ backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1050 }}>
                    <div className="modal-dialog modal-dialog-centered modal-sm">
                        <div className="modal-content shadow">
                            <div className="modal-header bg-primary text-white">
                                <h5 className="modal-title fw-bold">Thay đổi Quyền</h5>
                                <button type="button" className="btn-close btn-close-white" onClick={() => setShowModal(false)}></button>
                            </div>
                            <div className="modal-body p-4 text-center">
                                <p className="mb-3">Tài khoản: <strong>{selectedUser.username}</strong></p>
                                
                                <select 
                                    className="form-select border-primary fw-bold text-center" 
                                    value={selectedRoleId} 
                                    onChange={(e) => setSelectedRoleId(e.target.value)}
                                >
                                    <option value="" disabled>-- Chọn quyền mới --</option>
                                    {roles.map(role => (
                                        <option key={role._id || role.id} value={role._id || role.id}>
                                            {role.name}
                                        </option>
                                    ))}
                                </select>

                            </div>
                            <div className="modal-footer bg-light justify-content-center">
                                <button type="button" className="btn btn-secondary px-4" onClick={() => setShowModal(false)}>Hủy</button>
                                <button type="button" className="btn btn-success px-4 fw-bold" onClick={handleSaveRole}>Lưu lại</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
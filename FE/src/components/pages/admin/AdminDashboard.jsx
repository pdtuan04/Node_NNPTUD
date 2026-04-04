import React from 'react';

const AdminDashboard = () => {
    return (
        <div>
            <h2 className="mb-4">Dashboard</h2>

            {/* Stats Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Tổng Booking</h6>
                                    <h3 className="mb-0">156</h3>
                                </div>
                                <div className="bg-primary bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-calendar-check text-primary fs-3"></i>
                                </div>
                            </div>
                            <small className="text-success">
                                <i className="bi bi-arrow-up"></i> 12% so với tháng trước
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Doanh thu</h6>
                                    <h3 className="mb-0">45.6M</h3>
                                </div>
                                <div className="bg-success bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-currency-dollar text-success fs-3"></i>
                                </div>
                            </div>
                            <small className="text-success">
                                <i className="bi bi-arrow-up"></i> 8% so với tháng trước
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Khách hàng</h6>
                                    <h3 className="mb-0">89</h3>
                                </div>
                                <div className="bg-warning bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-people text-warning fs-3"></i>
                                </div>
                            </div>
                            <small className="text-success">
                                <i className="bi bi-arrow-up"></i> 5% so với tháng trước
                            </small>
                        </div>
                    </div>
                </div>

                <div className="col-md-3">
                    <div className="card border-0 shadow-sm">
                        <div className="card-body">
                            <div className="d-flex justify-content-between align-items-center">
                                <div>
                                    <h6 className="text-muted mb-2">Chờ xác nhận</h6>
                                    <h3 className="mb-0">12</h3>
                                </div>
                                <div className="bg-danger bg-opacity-10 p-3 rounded">
                                    <i className="bi bi-clock text-danger fs-3"></i>
                                </div>
                            </div>
                            <small className="text-muted">Cần xử lý ngay</small>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="card border-0 shadow-sm">
                <div className="card-header bg-white">
                    <h5 className="mb-0">Booking gần đây</h5>
                </div>
                <div className="card-body">
                    <div className="table-responsive">
                        <table className="table table-hover align-middle">
                            <thead>
                                <tr>
                                    <th>Mã Booking</th>
                                    <th>Khách hàng</th>
                                    <th>Dịch vụ</th>
                                    <th>Thời gian</th>
                                    <th>Trạng thái</th>
                                    <th>Thao tác</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td><strong>BK001</strong></td>
                                    <td>Nguyễn Văn A</td>
                                    <td>Tắm, Tỉa lông</td>
                                    <td>12/02/2026 10:00</td>
                                    <td><span className="badge bg-warning">Chờ xác nhận</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-primary">
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                                <tr>
                                    <td><strong>BK002</strong></td>
                                    <td>Trần Thị B</td>
                                    <td>Tắm</td>
                                    <td>11/02/2026 14:30</td>
                                    <td><span className="badge bg-success">Đã xác nhận</span></td>
                                    <td>
                                        <button className="btn btn-sm btn-primary">
                                            <i className="bi bi-eye"></i>
                                        </button>
                                    </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboard;
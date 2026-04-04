import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';

const CommentNode = ({ comment, allComments, isAuth, replyingTo, setReplyingTo, replyContent, setReplyContent, onSubmit, submitting }) => {
    const currentId = comment._id;
    const authorName = comment.user?.username || 'Người dùng';
    const replies = allComments.filter(c => c.parentId === currentId).sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));

    return (
        <div className="mb-3 mt-2">
            <div className="d-flex gap-3">
                <img src={`https://ui-avatars.com/api/?name=${authorName}&background=random`} className="rounded-circle shadow-sm" width="40" height="40" alt="Avatar" />
                <div className="flex-grow-1">
                    <div className="bg-light p-2 px-3 rounded border w-100">
                        <div className="fw-bold text-dark small">{authorName} <span className="text-muted fw-normal ms-2">{new Date(comment.createdAt).toLocaleString('vi-VN')}</span></div>
                        <div className="mt-1 text-secondary" style={{ whiteSpace: 'pre-wrap' }}>{comment.content}</div>
                    </div>
                    <div className="mt-1 ms-2">
                        <button className="btn btn-sm btn-link text-decoration-none p-0 fw-bold" onClick={() => setReplyingTo(replyingTo === currentId ? null : currentId)}>Trả lời</button>
                    </div>
                    {replyingTo === currentId && isAuth && (
                        <form onSubmit={(e) => onSubmit(e, currentId)} className="mt-2 mb-3 d-flex gap-2">
                            <textarea className="form-control form-control-sm" rows="2" placeholder="Viết phản hồi..." value={replyContent} onChange={e => setReplyContent(e.target.value)} required autoFocus></textarea>
                            <button type="submit" className="btn btn-sm btn-primary px-3" disabled={submitting}>Gửi</button>
                        </form>
                    )}
                    {replies.length > 0 && (
                        <div className="mt-2 ps-3 border-start">
                            {replies.map(reply => (
                                <CommentNode key={reply._id} comment={reply} allComments={allComments} isAuth={isAuth} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyContent={replyContent} setReplyContent={setReplyContent} onSubmit={onSubmit} submitting={submitting} />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const ArticleDetail = () => {
    const { id } = useParams();
    const { isAuth } = useAuth();
    const [article, setArticle] = useState(null);
    const [comments, setComments] = useState([]);
    const [newComment, setNewComment] = useState("");
    const [replyingTo, setReplyingTo] = useState(null);
    const [replyContent, setReplyContent] = useState("");
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const BACKEND_URL = 'http://localhost:8080';

    useEffect(() => {
        fetch(`${BACKEND_URL}/api/v1/articles/${id}`).then(res => res.json()).then(data => { setArticle(data); setLoading(false); });
        fetch(`${BACKEND_URL}/api/v1/comments/article/${id}`).then(res => res.json()).then(res => setComments(res.data || []));
    }, [id]);

    const handleCommentSubmit = async (e, parentId = null) => {
        e.preventDefault();
        const content = parentId ? replyContent : newComment;
        if (!content.trim()) return;

        const userStorage = JSON.parse(localStorage.getItem("user"));
        const token = userStorage?.token || "";

        try {
            setSubmitting(true);
            const response = await fetch(`${BACKEND_URL}/api/v1/comments`, {
                method: "POST",
                headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
                body: JSON.stringify({ 
                    article: id, // Gửi đúng tên 'article' thay vì 'articleId'
                    content: content, 
                    parentId: parentId 
                })
            });
            const result = await response.json();
            if (response.ok) {
                setComments([result.data, ...comments]);
                parentId ? (setReplyContent(""), setReplyingTo(null)) : setNewComment("");
            } else {
                alert(result.message || "Lỗi khi gửi");
            }
        } catch (err) {
            alert("Lỗi kết nối");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center py-5"><div className="spinner-border text-primary"></div></div>;
    if (!article) return <div className="container text-center py-5"><h2>Bài viết không tồn tại</h2><Link to="/articles" className="btn btn-primary">Quay lại</Link></div>;

    return (
        <div className="container py-5 mt-5">
            <div className="row justify-content-center">
                <div className="col-lg-9">
                    <h1 className="fw-bold text-primary mb-4">{article.title}</h1>
                    <div className="mb-4 border rounded p-4 bg-white shadow-sm">
                        {article.imageUrl && <img src={article.imageUrl.startsWith('http') ? article.imageUrl : `${BACKEND_URL}/${article.imageUrl}`} className="img-fluid rounded mb-4 w-100" style={{maxHeight: '400px', objectFit: 'cover'}} alt="" />}
                        <div className="fs-5" style={{lineHeight: '1.8'}} dangerouslySetInnerHTML={{ __html: article.content }} />
                    </div>

                    <div className="p-4 border rounded bg-white shadow-sm">
                        <h4 className="fw-bold mb-4">Bình luận ({comments.length})</h4>
                        {isAuth ? (
                            <form onSubmit={(e) => handleCommentSubmit(e, null)} className="mb-4">
                                <textarea className="form-control mb-2" rows="3" placeholder="Viết bình luận của bạn..." value={newComment} onChange={e => setNewComment(e.target.value)} required></textarea>
                                <button type="submit" className="btn btn-primary" disabled={submitting}>Gửi bình luận</button>
                            </form>
                        ) : (
                            <div className="alert alert-secondary text-center">Vui lòng <Link to="/login">đăng nhập</Link> để bình luận.</div>
                        )}
                        <div>
                            {comments.filter(c => !c.parentId).map(comment => (
                                <CommentNode key={comment._id} comment={comment} allComments={comments} isAuth={isAuth} replyingTo={replyingTo} setReplyingTo={setReplyingTo} replyContent={replyContent} setReplyContent={setReplyContent} onSubmit={handleCommentSubmit} submitting={submitting} />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ArticleDetail;
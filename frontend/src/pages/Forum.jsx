/**
 * Forum page: Community forum for students.
 * Students can create posts, like, comment. Admins see analytics instead.
 */

import { useState, useEffect, useRef } from 'react';
import { apiRequest, apiUpload } from '../api';
import { useAuth } from '../context/AuthContext';

const ACCEPTED_IMAGE_TYPES = 'image/jpeg,image/png,image/gif,image/webp';
const MAX_IMAGE_SIZE_MB = 5;

export default function Forum() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [postContent, setPostContent] = useState('');
  const [postImageFile, setPostImageFile] = useState(null);
  const [postImagePreview, setPostImagePreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [commentTexts, setCommentTexts] = useState({});
  const [commenting, setCommenting] = useState({});

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await apiRequest('/forum/posts');
      setPosts(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(err.message || 'Failed to load posts');
    } finally {
      setLoading(false);
    }
  };

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      setPostImageFile(null);
      setPostImagePreview(null);
      return;
    }
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file (JPEG, PNG, GIF, or WebP).');
      return;
    }
    if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
      setError(`Image must be under ${MAX_IMAGE_SIZE_MB}MB.`);
      return;
    }
    setError('');
    setPostImageFile(file);
    const reader = new FileReader();
    reader.onload = () => setPostImagePreview(reader.result);
    reader.readAsDataURL(file);
  };

  const clearImage = () => {
    setPostImageFile(null);
    setPostImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!postContent.trim()) {
      setError('Post content is required');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      let imageUrl = '';
      if (postImageFile) {
        const { imageUrl: uploadedUrl } = await apiUpload('/forum/upload', postImageFile);
        imageUrl = uploadedUrl || '';
      }
      await apiRequest('/forum/posts', {
        method: 'POST',
        body: JSON.stringify({ content: postContent.trim(), imageUrl }),
      });
      setPostContent('');
      clearImage();
      fetchPosts();
    } catch (err) {
      setError(err.message || 'Failed to create post');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLike = async (postId) => {
    try {
      const updatedPost = await apiRequest(`/forum/posts/${postId}/like`, { method: 'POST' });
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    } catch (err) {
      setError(err.message || 'Failed to like post');
    }
  };

  const handleAddComment = async (postId) => {
    const text = commentTexts[postId];
    if (!text || !text.trim()) return;
    setCommenting((prev) => ({ ...prev, [postId]: true }));
    try {
      const updatedPost = await apiRequest(`/forum/posts/${postId}/comment`, {
        method: 'POST',
        body: JSON.stringify({ text: text.trim() }),
      });
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
      setCommentTexts((prev) => ({ ...prev, [postId]: '' }));
    } catch (err) {
      setError(err.message || 'Failed to add comment');
    } finally {
      setCommenting((prev) => ({ ...prev, [postId]: false }));
    }
  };

  const handleDeletePost = async (postId) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      await apiRequest(`/forum/posts/${postId}`, { method: 'DELETE' });
      setPosts((prev) => prev.filter((p) => p._id !== postId));
    } catch (err) {
      setError(err.message || 'Failed to delete post');
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const updatedPost = await apiRequest(`/forum/comments/${postId}/${commentId}`, { method: 'DELETE' });
      setPosts((prev) => prev.map((p) => (p._id === postId ? updatedPost : p)));
    } catch (err) {
      setError(err.message || 'Failed to delete comment');
    }
  };

  const isLiked = (post) => {
    return post.likes?.some((like) => (typeof like === 'object' ? like._id : like) === user?.id);
  };

  const canDelete = (post) => {
    return post.userId?._id === user?.id || post.userId === user?.id;
  };

  const canDeleteComment = (comment) => {
    return comment.userId?._id === user?.id || comment.userId === user?.id;
  };

  if (loading) {
    return (
      <div className="loading-wrap">
        <div className="loading-spinner" aria-hidden />
        <p>Loading forum...</p>
      </div>
    );
  }

  return (
    <div>
      <h1>Community Forum</h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem', fontSize: '1.05rem' }}>
        Share thoughts, ask questions, and connect with fellow students.
      </p>

      {error && <div className="message-error" role="alert">{error}</div>}

      {/* Create Post Section - Only for students */}
      {user?.role !== 'admin' && (
        <div className="card" style={{ marginBottom: '2rem' }}>
          <h2 style={{ marginBottom: '1rem' }}>Create Post</h2>
          <form onSubmit={handleCreatePost}>
            <div className="form-group">
              <label htmlFor="post-content">What's on your mind?</label>
              <textarea
                id="post-content"
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="Share your thoughts..."
                maxLength={2000}
                disabled={submitting}
                rows={4}
              />
              <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                {postContent.length}/2000
              </div>
            </div>
            <div className="form-group">
              <label htmlFor="post-image">Add image (optional, max {MAX_IMAGE_SIZE_MB}MB)</label>
              <input
                ref={fileInputRef}
                id="post-image"
                type="file"
                accept={ACCEPTED_IMAGE_TYPES}
                onChange={handleImageSelect}
                disabled={submitting}
                style={{ display: 'block', marginTop: '0.25rem' }}
              />
              {postImagePreview && (
                <div style={{ marginTop: '0.75rem', position: 'relative', display: 'inline-block' }}>
                  <img
                    src={postImagePreview}
                    alt="Preview"
                    style={{
                      maxWidth: '200px',
                      maxHeight: '200px',
                      borderRadius: 'var(--radius)',
                      border: '1px solid var(--color-border)',
                      objectFit: 'cover',
                    }}
                  />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="btn btn-outline"
                    style={{
                      position: 'absolute',
                      top: '0.5rem',
                      right: '0.5rem',
                      padding: '0.25rem 0.5rem',
                      fontSize: '0.875rem',
                    }}
                  >
                    Remove
                  </button>
                </div>
              )}
            </div>
            <button type="submit" className="btn btn-primary" disabled={submitting || !postContent.trim()}>
              {submitting ? <span className="loading-spinner" aria-hidden /> : null}
              {submitting ? ' Posting...' : 'Post'}
            </button>
          </form>
        </div>
      )}

      {/* Posts Feed */}
      <h2 style={{ marginBottom: '1rem' }}>Recent Posts</h2>
      {posts.length === 0 ? (
        <p style={{ color: 'var(--color-text-muted)' }}>No posts yet. Be the first to share!</p>
      ) : (
        posts.map((post) => (
          <div key={post._id} className="card" style={{ marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
              <div>
                <strong style={{ color: 'var(--color-primary)', fontSize: '1rem' }}>
                  {post.userId?.name || 'Unknown User'}
                </strong>
                <div style={{ fontSize: '0.875rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                  {new Date(post.createdAt).toLocaleString()}
                </div>
              </div>
              {canDelete(post) && (
                <button
                  type="button"
                  className="btn btn-outline"
                  style={{ padding: '0.4rem 0.75rem', fontSize: '0.875rem' }}
                  onClick={() => handleDeletePost(post._id)}
                >
                  Delete
                </button>
              )}
            </div>

            <p style={{ marginBottom: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{post.content}</p>

            {post.imageUrl && (
              <div style={{ marginBottom: '1rem' }}>
                <img
                  src={post.imageUrl}
                  alt="Post attachment"
                  style={{ maxWidth: '100%', borderRadius: 'var(--radius)', border: '1px solid var(--color-border)' }}
                  onError={(e) => {
                    e.target.style.display = 'none';
                  }}
                />
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '1rem', paddingTop: '0.75rem', borderTop: '1px solid var(--color-border)' }}>
              {user?.role !== 'admin' && (
                <button
                  type="button"
                  onClick={() => handleLike(post._id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    background: 'transparent',
                    border: 'none',
                    color: isLiked(post) ? 'var(--color-error)' : 'var(--color-text-muted)',
                    cursor: 'pointer',
                    fontSize: '0.9375rem',
                    fontWeight: 500,
                    padding: '0.25rem 0.5rem',
                    borderRadius: 'var(--radius)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'var(--color-primary-soft)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'transparent';
                  }}
                >
                  <span>{isLiked(post) ? '❤️' : '🤍'}</span>
                  <span>{post.likes?.length || 0}</span>
                </button>
              )}
              <span style={{ color: 'var(--color-text-muted)', fontSize: '0.9375rem' }}>
                {post.comments?.length || 0} {post.comments?.length === 1 ? 'comment' : 'comments'}
              </span>
            </div>

            {/* Comments Section */}
            {post.comments && post.comments.length > 0 && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <h3 style={{ fontSize: '0.9375rem', fontWeight: 600, marginBottom: '0.75rem', color: 'var(--color-text)' }}>
                  Comments
                </h3>
                {post.comments.map((comment) => (
                  <div key={comment._id} style={{ marginBottom: '0.75rem', padding: '0.75rem', background: 'var(--color-bg)', borderRadius: 'var(--radius)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <strong style={{ fontSize: '0.875rem', color: 'var(--color-primary)' }}>
                          {comment.userId?.name || 'Unknown'}
                        </strong>
                        <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: 'var(--color-text)' }}>{comment.text}</p>
                        <small style={{ color: 'var(--color-text-muted)', fontSize: '0.75rem' }}>
                          {new Date(comment.createdAt).toLocaleString()}
                        </small>
                      </div>
                      {canDeleteComment(comment) && (
                        <button
                          type="button"
                          className="btn btn-outline"
                          style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', marginLeft: '0.5rem' }}
                          onClick={() => handleDeleteComment(post._id, comment._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Comment Input - Only for students */}
            {user?.role !== 'admin' && (
              <div style={{ marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid var(--color-border)' }}>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <input
                    type="text"
                    value={commentTexts[post._id] || ''}
                    onChange={(e) => setCommentTexts((prev) => ({ ...prev, [post._id]: e.target.value }))}
                    placeholder="Write a comment..."
                    maxLength={500}
                    disabled={commenting[post._id]}
                    style={{
                      flex: 1,
                      padding: '0.5rem 0.75rem',
                      border: '1px solid var(--color-border)',
                      borderRadius: 'var(--radius)',
                      fontSize: '0.9375rem',
                    }}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleAddComment(post._id);
                      }
                    }}
                  />
                  <button
                    type="button"
                    className="btn btn-accent"
                    onClick={() => handleAddComment(post._id)}
                    disabled={commenting[post._id] || !commentTexts[post._id]?.trim()}
                  >
                    {commenting[post._id] ? <span className="loading-spinner" aria-hidden /> : 'Comment'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

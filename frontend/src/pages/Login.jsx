import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { LogIn, Mail, Lock, ArrowRight, Activity, ShieldCheck, Zap } from 'lucide-react';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await login({ email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-wrapper">
      {/* Cinematic Animated Background using a video */}
      <div className="cinematic-bg-container">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className="cinematic-bg-video"
        >
          <source src="/login-bg-video.mp4" type="video/mp4" />
        </video>
        <div className="cinematic-bg-overlay"></div>
      </div>
      
      <div className="login-premium-container animate-fade-in-up">
        
        {/* Left Side - Form Section */}
        <div className="login-form-side">
          <div className="login-header">
            <div className="brand-logo-glow">
              <Activity size={32} className="brand-icon" />
            </div>
            <h2 className="font-important">Welcome Back</h2>
            <p className="subtitle text-muted">Sign in to Smart Lact AI Platform</p>
          </div>

          {error && (
            <div className="error-banner animate-shake">
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="premium-form">
            <div className={`input-group ${focusedInput === 'email' ? 'focused' : ''}`}>
              <Mail className="input-icon" size={20} />
              <div className="input-floating-wrapper">
                <input 
                  type="email" 
                  id="email"
                  className="premium-input" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  onFocus={() => setFocusedInput('email')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder=" " /* for floating label css trick */
                  required 
                />
                <label htmlFor="email" className="floating-label">Email Address</label>
              </div>
            </div>

            <div className={`input-group ${focusedInput === 'password' ? 'focused' : ''}`}>
              <Lock className="input-icon" size={20} />
              <div className="input-floating-wrapper">
                <input 
                  type="password" 
                  id="password"
                  className="premium-input" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  onFocus={() => setFocusedInput('password')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder=" "
                  required 
                />
                <label htmlFor="password" className="floating-label">Password</label>
              </div>
            </div>

            <div className="form-options">
              <label className="checkbox-container">
                <input type="checkbox" />
                Remember me
              </label>
              <a href="#" className="forgot-password">Forgot password?</a>
            </div>

            <button type="submit" className="premium-btn-submit" disabled={isLoading}>
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>Sign In</span>
                  <ArrowRight size={20} className="btn-icon-right" />
                </>
              )}
            </button>
          </form>

          <p className="register-prompt">
            Don't have an account? <Link to="/register" className="register-link">Sign Up</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;

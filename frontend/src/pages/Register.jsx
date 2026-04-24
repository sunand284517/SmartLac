import React, { useState, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { UserPlus, User, Mail, Lock, ArrowRight, ShieldCheck, Zap, Activity } from 'lucide-react';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [focusedInput, setFocusedInput] = useState(null);
  const { register } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      await register({ name, email, password });
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register');
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
      
      {/* Reusing the premium transparent glassmorphism classes */}
      <div className="login-premium-container animate-fade-in-up">
        
        {/* Left Side - Form Section */}
        <div className="login-form-side">
          <div className="login-header">
            <div className="brand-logo-glow">
              <Activity size={32} className="brand-icon" />
            </div>
            <h2 className="font-important">Create Account</h2>
            <p className="subtitle text-muted">Join the Smart Lact AI Platform</p>
          </div>

          {error && (
            <div className="error-banner animate-shake">
              <span className="error-text">{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="premium-form">
            <div className={`input-group ${focusedInput === 'name' ? 'focused' : ''}`}>
              <User className="input-icon" size={20} />
              <div className="input-floating-wrapper">
                <input 
                  type="text" 
                  id="name"
                  className="premium-input" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  onFocus={() => setFocusedInput('name')}
                  onBlur={() => setFocusedInput(null)}
                  placeholder=" "
                  required 
                />
                <label htmlFor="name" className="floating-label">Full Name</label>
              </div>
            </div>

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
                  placeholder=" "
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
                  minLength="6"
                />
                <label htmlFor="password" className="floating-label">Password</label>
              </div>
            </div>

            <button type="submit" className="premium-btn-submit" disabled={isLoading}>
              {isLoading ? (
                <div className="spinner"></div>
              ) : (
                <>
                  <span>Sign Up</span>
                  <ArrowRight size={20} className="btn-icon-right" />
                </>
              )}
            </button>
          </form>

          <p className="register-prompt">
            Already have an account? <Link to="/login" className="register-link">Sign In</Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;

import { createContext, useContext, useState, useEffect, useRef } from 'react';

// ==========================================
// 1. API STORAGE CLIENT (Merged from storage.js)
// ==========================================
const SERVER_URL = 'http://localhost:3001';

const DEFAULT_DATA = {
  candidates: [
    { id: 1, name: "BJP (Bharatiya Janata Party)", vote_count: 0 },
    { id: 2, name: "AAP (Aam Aadmi Party)", vote_count: 0 },
    { id: 3, name: "INC (Indian National Congress)", vote_count: 0 },
    { id: 4, name: "NOTA (None of the Above)", vote_count: 0 },
    { id: 5, name: "SP (Samajwadi Party)", vote_count: 0 }
  ],
  voters: [
    { voter_id: "VUP47392", full_name: "Aarav Sharma", phone: "9876543210", email: "aarav.sharma@example.com", is_used: 0, phone_otp: "482910", email_otp: "736251" },
    { voter_id: "VDL81620", full_name: "Isha Patel", phone: "8765432109", email: "isha.patel@example.com", is_used: 0, phone_otp: "193047", email_otp: "528374" },
    { voter_id: "VKA30517", full_name: "Rohan Gupta", phone: "7654321098", email: "rohan.gupta@example.com", is_used: 0, phone_otp: "847362", email_otp: "019283" },
    { voter_id: "VTN92746", full_name: "Meera Nair", phone: "9012345678", email: "meera.nair@example.com", is_used: 0, phone_otp: "571038", email_otp: "294716" },
    { voter_id: "VRJ54803", full_name: "Vikram Singh", phone: "8901234567", email: "vikram.singh@example.com", is_used: 0, phone_otp: "638492", email_otp: "815037" },
    { voter_id: "VWB61938", full_name: "Ananya Das", phone: "7890123456", email: "ananya.das@example.com", is_used: 0, phone_otp: "420185", email_otp: "963574" }
  ],
  users: [],
  votes: []
};

let isServerOffline = false;

async function fetchData() {
  try {
    const response = await fetch(`${SERVER_URL}/data`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' },
    });
    if (!response.ok) throw new Error('Server returned error status');
    const data = await response.json();
    isServerOffline = false;
    localStorage.setItem('voting_data', JSON.stringify(data));
    return data;
  } catch {
    console.warn("Backend server offline. Falling back to local storage.");
    isServerOffline = true;
    const local = localStorage.getItem('voting_data');
    if (local) {
      try {
        return JSON.parse(local);
      } catch {
        return DEFAULT_DATA;
      }
    }
    localStorage.setItem('voting_data', JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
}

async function saveData(data) {
  localStorage.setItem('voting_data', JSON.stringify(data));
  if (isServerOffline) {
    try {
      const response = await fetch(`${SERVER_URL}/data`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });
      if (response.ok) isServerOffline = false;
    } catch {
      // Still offline
    }
    return;
  }

  try {
    const response = await fetch(`${SERVER_URL}/data`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!response.ok) throw new Error('Failed to write data to server');
  } catch {
    console.warn("Failed to sync with backend server. Saving locally only.");
    isServerOffline = true;
  }
}

// ==========================================
// 2. STATE CONTEXT & HOOKS (Merged from SpendingsContext.jsx)
// ==========================================
const SpendingsContext = createContext(null);

export function SpendingsProvider({ children }) {
  const [candidates, setCandidates] = useState([]);
  const [voters, setVoters] = useState([]);
  const [users, setUsers] = useState([]);
  const [votes, setVotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const [currentUser, setCurrentUser] = useState(null);
  const [pendingVoter, setPendingVoter] = useState(null);
  const [otpStep, setOtpStep] = useState(false);

  useEffect(() => {
    async function load() {
      const data = await fetchData();
      setCandidates(data.candidates || []);
      setVoters(data.voters || []);
      setUsers(data.users || []);
      setVotes(data.votes || []);

      const storedUser = localStorage.getItem('voting_session_user');
      if (storedUser) {
        try {
          setCurrentUser(JSON.parse(storedUser));
        } catch {
          localStorage.removeItem('voting_session_user');
        }
      }

      const storedPending = localStorage.getItem('voting_session_pending');
      if (storedPending) {
        try {
          setPendingVoter(JSON.parse(storedPending));
        } catch {
          localStorage.removeItem('voting_session_pending');
        }
      }

      const storedOtpStep = localStorage.getItem('voting_session_otp_step');
      if (storedOtpStep) {
        setOtpStep(storedOtpStep === 'true');
      }

      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (loading) return;
    const delayDebounceFn = setTimeout(async () => {
      setIsSaving(true);
      await saveData({ candidates, voters, users, votes });
      setIsSaving(false);
    }, 500);
    return () => clearTimeout(delayDebounceFn);
  }, [candidates, voters, users, votes, loading]);

  useEffect(() => {
    if (loading) return;
    const interval = setInterval(async () => {
      if (!isSaving) {
        const data = await fetchData();
        const nextCandidates = data.candidates || [];
        const nextVoters = data.voters || [];
        const nextUsers = data.users || [];
        const nextVotes = data.votes || [];

        const currentStr = JSON.stringify({ candidates, voters, users, votes });
        const fetchedStr = JSON.stringify({ candidates: nextCandidates, voters: nextVoters, users: nextUsers, votes: nextVotes });

        if (currentStr !== fetchedStr) {
          setCandidates(nextCandidates);
          setVoters(nextVoters);
          setUsers(nextUsers);
          setVotes(nextVotes);
        }
      }
    }, 10000);
    return () => clearInterval(interval);
  }, [candidates, voters, users, votes, loading, isSaving]);

  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('voting_session_user', JSON.stringify(currentUser));
    } else {
      localStorage.removeItem('voting_session_user');
    }
  }, [currentUser]);

  useEffect(() => {
    if (pendingVoter) {
      localStorage.setItem('voting_session_pending', JSON.stringify(pendingVoter));
    } else {
      localStorage.removeItem('voting_session_pending');
    }
  }, [pendingVoter]);

  useEffect(() => {
    localStorage.setItem('voting_session_otp_step', otpStep.toString());
  }, [otpStep]);

  const verifyVoter = (voterId) => {
    if (!voterId || !voterId.trim()) return { error: 'Please enter a valid Voter ID.' };
    const cleanId = voterId.trim().toUpperCase();
    const voter = voters.find(v => v.voter_id === cleanId);
    if (!voter) return { error: 'Voter ID not found in the national registry.' };
    if (voter.is_used === 1) return { error: 'This Voter ID has already been used to cast a vote.' };
    setPendingVoter(voter);
    setOtpStep(false);
    return { success: true };
  };

  const sendOtpCodes = () => setOtpStep(true);

  const verifyOtp = (phoneOtp, emailOtp) => {
    if (!pendingVoter) return { error: 'No voter session in progress. Please re-verify Voter ID.' };
    if (phoneOtp !== pendingVoter.phone_otp || emailOtp !== pendingVoter.email_otp) {
      return { error: 'Invalid verification codes. Please check and try again.' };
    }
    let user = users.find(u => u.voter_id === pendingVoter.voter_id);
    let updatedUsers = [...users];
    if (!user) {
      user = {
        id: users.length + 1,
        username: pendingVoter.full_name,
        password: 'auto_generated',
        voter_id: pendingVoter.voter_id,
        has_voted: 0
      };
      updatedUsers.push(user);
      setUsers(updatedUsers);
    }
    const sessionUser = {
      userId: user.id,
      username: user.username,
      voterId: user.voter_id,
      hasVoted: user.has_voted
    };
    setCurrentUser(sessionUser);
    setPendingVoter(null);
    setOtpStep(false);
    return { success: true };
  };

  const castVote = (candidateId) => {
    if (!currentUser) return { error: 'Session expired. Please log in again.' };
    if (currentUser.hasVoted === 1) return { error: 'You have already cast your vote.' };
    const cId = parseInt(candidateId);
    if (!candidates.some(c => c.id === cId)) return { error: 'Invalid candidate selection.' };

    setCandidates(prev => prev.map(c => c.id === cId ? { ...c, vote_count: c.vote_count + 1 } : c));
    setVoters(prev => prev.map(v => v.voter_id === currentUser.voterId ? { ...v, is_used: 1 } : v));
    setUsers(prev => prev.map(u => u.id === currentUser.userId ? { ...u, has_voted: 1 } : u));
    setVotes(prev => [...prev, { id: prev.length + 1, user_id: currentUser.userId, candidate_id: cId }]);
    setCurrentUser(prev => ({ ...prev, hasVoted: 1 }));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    setPendingVoter(null);
    setOtpStep(false);
    localStorage.removeItem('voting_session_user');
    localStorage.removeItem('voting_session_pending');
    localStorage.removeItem('voting_session_otp_step');
  };

  return (
    <SpendingsContext.Provider value={{
      candidates, voters, users, votes, loading, isSaving, currentUser, pendingVoter, otpStep,
      verifyVoter, sendOtpCodes, verifyOtp, castVote, logout
    }}>
      {children}
    </SpendingsContext.Provider>
  );
}

export function useSpendings() {
  const context = useContext(SpendingsContext);
  if (!context) throw new Error('useSpendings must be used within a SpendingsProvider');
  return context;
}

// ==========================================
// 3. PAGE VIEW COMPONENTS
// ==========================================

// --- Navbar ---
function Navbar() {
  const { currentUser, logout } = useSpendings();
  const handleBrandClick = (e) => {
    e.preventDefault();
    if (currentUser) {
      window.location.hash = currentUser.hasVoted === 1 ? '#/results' : '#/vote';
    } else {
      window.location.hash = '#/verify-voter';
    }
  };
  const handleLogout = (e) => {
    e.preventDefault();
    logout();
    window.location.hash = '#/verify-voter';
  };
  return (
    <nav className="navbar">
      <a href="#/verify-voter" onClick={handleBrandClick} className="navbar-brand">
        <div className="brand-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <span>National Electoral Commission</span>
      </a>
      <div className="navbar-links">
        <a href="#/results">Live Results</a>
        {currentUser ? (
          <a href="#/logout" onClick={handleLogout} className="portal">Logout</a>
        ) : (
          <a href="#" onClick={(e) => e.preventDefault()} className="portal">Official Portal</a>
        )}
      </div>
    </nav>
  );
}

// --- Verify Voter ---
function VerifyVoter() {
  const { verifyVoter } = useSpendings();
  const [voterId, setVoterId] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const result = verifyVoter(voterId);
    if (result.error) setError(result.error);
    else if (result.success) window.location.hash = '#/verify-otp';
  };

  return (
    <main className="page-center">
      <div className="auth-card">
        <div className="card-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </div>
        <h1>Voter Authentication</h1>
        <p className="card-subtitle">Access the digital ballot by entering your National Voter Registration Number.</p>
        {error && <div className="error-msg">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="voter_id">Voter Registration ID</label>
            <input
              type="text"
              id="voter_id"
              placeholder="e.g. VUP47392"
              autoComplete="off"
              value={voterId}
              onChange={(e) => setVoterId(e.target.value)}
              required
            />
          </div>
          <button type="submit" className="btn-primary">Verify Identity</button>
        </form>
      </div>
      <div className="page-footer">
        <div className="footer-title">Secure Voting System</div>
        <div className="footer-sub">Protected by end-to-end encryption. Your privacy is guaranteed.</div>
      </div>
    </main>
  );
}

// --- Verify OTP ---
function VerifyOtp() {
  const { pendingVoter, otpStep, sendOtpCodes, verifyOtp, logout } = useSpendings();
  const [phoneOtp, setPhoneOtp] = useState(['', '', '', '', '', '']);
  const [emailOtp, setEmailOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState(null);

  const phoneRefs = useRef([]);
  const emailRefs = useRef([]);

  useEffect(() => {
    if (!pendingVoter) window.location.hash = '#/verify-voter';
  }, [pendingVoter]);

  useEffect(() => {
    if (otpStep && phoneRefs.current[0]) phoneRefs.current[0].focus();
  }, [otpStep]);

  if (!pendingVoter) return null;

  const getMaskedPhone = (p) => p && p.length > 5 ? p.substring(0, 3) + '****' + p.substring(p.length - 2) : p;
  const getMaskedEmail = (e) => {
    if (e && e.includes('@')) {
      const idx = e.indexOf('@');
      return e.substring(0, Math.min(2, idx)) + '***' + e.substring(idx);
    }
    return e;
  };

  const handleInputChange = (idx, val, refs, setVal) => {
    const cleanVal = val.replace(/[^0-9]/g, '');
    if (!cleanVal) {
      setVal(prev => { const c = [...prev]; c[idx] = ''; return c; });
      return;
    }
    const digit = cleanVal[cleanVal.length - 1];
    setVal(prev => { const c = [...prev]; c[idx] = digit; return c; });
    if (idx < 5 && refs.current[idx + 1]) refs.current[idx + 1].focus();
  };

  const handleKeyDown = (idx, e, refs, setVal) => {
    if (e.key === 'Backspace') {
      setVal(prev => {
        if (prev[idx] === '') {
          if (idx > 0 && refs.current[idx - 1]) {
            refs.current[idx - 1].focus();
            const c = [...prev]; c[idx - 1] = ''; return c;
          }
        } else {
          const c = [...prev]; c[idx] = ''; return c;
        }
        return prev;
      });
    }
  };

  const handlePaste = (idx, e, refs, setVal) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/[^0-9]/g, '');
    if (!paste) return;
    setVal(prev => {
      const c = [...prev];
      for (let i = 0; i < paste.length && (idx + i) < 6; i++) c[idx + i] = paste[i];
      const target = Math.min(idx + paste.length, 5);
      if (refs.current[target]) refs.current[target].focus();
      return c;
    });
  };

  const handleSendCodes = (e) => {
    e.preventDefault();
    sendOtpCodes();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const combinedPhone = phoneOtp.join('');
    const combinedEmail = emailOtp.join('');
    if (combinedPhone.length < 6 || combinedEmail.length < 6) {
      setError('Please fill in all 6 digits of both codes.');
      return;
    }
    const result = verifyOtp(combinedPhone, combinedEmail);
    if (result.error) setError(result.error);
    else if (result.success) window.location.hash = '#/vote';
  };

  const handleNotYou = (e) => {
    e.preventDefault();
    logout();
    window.location.hash = '#/verify-voter';
  };

  return (
    <main className="page-center">
      {!otpStep ? (
        <div className="auth-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/><path d="M9 12l2 2 4-4"/>
            </svg>
          </div>
          <h1>Voter Authentication</h1>
          <p className="card-subtitle">Access the digital ballot by entering your National Voter Registration Number.</p>
          <div className="voter-info-table">
            <div className="info-row"><span className="info-label">Voter</span><span className="info-value">{pendingVoter.full_name}</span></div>
            <div className="info-row"><span className="info-label">Phone</span><span className="info-value">{getMaskedPhone(pendingVoter.phone)}</span></div>
            <div className="info-row"><span className="info-label">Email</span><span className="info-value">{getMaskedEmail(pendingVoter.email)}</span></div>
          </div>
          <p className="voter-info-note">To proceed, we will send a one-time passcode to both your registered phone and email.</p>
          <button onClick={handleSendCodes} className="btn-primary" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>Send Authentication Codes</button>
          <a href="#/verify-voter" onClick={handleNotYou} className="link-secondary">Not you? Enter a different ID</a>
        </div>
      ) : (
        <div className="auth-card">
          <div className="card-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          </div>
          <h1>Dual Verification</h1>
          <p className="card-subtitle">Please enter the 6-digit codes sent to your registered phone and email address.</p>
          {error && <div className="error-msg">{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className="otp-section">
              <div className="otp-label">Phone SMS Code</div>
              <div className="otp-boxes">
                {phoneOtp.map((digit, i) => (
                  <input
                    key={`phone-${i}`}
                    type="text"
                    maxLength="1"
                    inputMode="numeric"
                    pattern="[0-9]"
                    ref={el => phoneRefs.current[i] = el}
                    value={digit}
                    onChange={(e) => handleInputChange(i, e.target.value, phoneRefs, setPhoneOtp)}
                    onKeyDown={(e) => handleKeyDown(i, e, phoneRefs, setPhoneOtp)}
                    onPaste={(e) => handlePaste(i, e, phoneRefs, setPhoneOtp)}
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>
            <div className="otp-section">
              <div className="otp-label">Email Code</div>
              <div className="otp-boxes">
                {emailOtp.map((digit, i) => (
                  <input
                    key={`email-${i}`}
                    type="text"
                    maxLength="1"
                    inputMode="numeric"
                    pattern="[0-9]"
                    ref={el => emailRefs.current[i] = el}
                    value={digit}
                    onChange={(e) => handleInputChange(i, e.target.value, emailRefs, setEmailOtp)}
                    onKeyDown={(e) => handleKeyDown(i, e, emailRefs, setEmailOtp)}
                    onPaste={(e) => handlePaste(i, e, emailRefs, setEmailOtp)}
                    autoComplete="off"
                  />
                ))}
              </div>
            </div>
            <button type="submit" className="btn-primary">Access Ballot</button>
          </form>
          <a href="#/verify-voter" onClick={handleNotYou} className="link-secondary">Cancel and Return</a>
        </div>
      )}
      <div className="page-footer">
        <div className="footer-title">Secure Voting System</div>
        <div className="footer-sub">Protected by end-to-end encryption. Your privacy is guaranteed.</div>
      </div>
    </main>
  );
}

// --- Vote ---
function Vote() {
  const { currentUser, candidates, castVote } = useSpendings();
  const [selectedId, setSelectedId] = useState(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    if (!currentUser) window.location.hash = '#/verify-voter';
    else if (currentUser.hasVoted === 1) window.location.hash = '#/results';
  }, [currentUser]);

  if (!currentUser || currentUser.hasVoted === 1) return null;

  const parseCandidate = (fullName) => {
    const idx = fullName.lastIndexOf('(');
    return idx > 0 ? {
      name: fullName.substring(0, idx).trim(),
      party: fullName.substring(idx + 1, fullName.length - 1).trim()
    } : { name: fullName, party: '' };
  };

  const handleReview = () => {
    if (!selectedId) {
      alert('Please select a candidate before submitting.');
      return;
    }
    setShowModal(true);
  };

  const handleCastVote = () => {
    const res = castVote(selectedId);
    if (res.error) alert(res.error);
    else {
      setShowModal(false);
      window.location.hash = '#/confirmed';
    }
  };

  const selectedCandidate = candidates.find(c => c.id === selectedId);
  const selectedDetails = selectedCandidate ? parseCandidate(selectedCandidate.name) : { name: '', party: '' };

  return (
    <>
      <div className="ballot-banner">
        <div className="banner-left">
          <h2>Official Digital Ballot</h2>
          <p>Elector: {currentUser.username}</p>
        </div>
        <div className="banner-right">
          <div className="status-label">Status</div>
          <div className="status-badge"><span className="status-dot"></span> Authenticated</div>
        </div>
      </div>
      <div className="vote-content">
        <h1>Select Candidate</h1>
        <p className="vote-subtitle">Review the candidates carefully. You may only cast one vote, and this action cannot be undone.</p>
        <div className="candidate-list">
          {candidates.map((c) => {
            const { name, party } = parseCandidate(c.name);
            const isSelected = selectedId === c.id;
            return (
              <div
                key={c.id}
                className={`candidate-row ${isSelected ? 'selected' : ''}`}
                onClick={() => setSelectedId(c.id)}
                style={{ cursor: 'pointer' }}
              >
                <div className="radio-circle"></div>
                <input type="radio" name="candidate" value={c.id} checked={isSelected} readOnly />
                <div className="candidate-info">
                  <div className="candidate-name">{name}</div>
                  <div className="candidate-party">{party}</div>
                  <div className="candidate-role">Prime Minister Candidate</div>
                </div>
              </div>
            );
          })}
        </div>
        <button type="button" className="btn-submit-ballot" onClick={handleReview}>Review &amp; Submit Ballot</button>
      </div>
      <div className={`modal-overlay ${showModal ? 'active' : ''}`} onClick={(e) => e.target.classList.contains('modal-overlay') && setShowModal(false)}>
        <div className="modal-content">
          <button className="modal-close" onClick={() => setShowModal(false)}>&times;</button>
          <h2>Confirm Selection</h2>
          <p className="modal-desc">You are about to cast your official vote for:</p>
          <div className="modal-candidate-card">
            <div className="mc-name">{selectedDetails.name}</div>
            <div className="mc-party">{selectedDetails.party}</div>
          </div>
          <div className="modal-warning">This action is final and cannot be altered.</div>
          <div className="modal-actions">
            <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>Return to Ballot</button>
            <button type="button" className="btn-confirm" onClick={handleCastVote}>Cast Official Vote</button>
          </div>
        </div>
      </div>
    </>
  );
}

// --- Confirmed Receipt ---
function generateReceiptHash() {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  const parts = [];
  for (let p = 0; p < 4; p++) {
    let seg = '';
    for (let i = 0; i < 8; i++) seg += chars.charAt(Math.floor(Math.random() * chars.length));
    parts.push(seg);
  }
  return parts.join('-');
}

function Confirmed() {
  const { currentUser, logout } = useSpendings();
  const [receiptHash] = useState(() => generateReceiptHash());

  useEffect(() => {
    if (!currentUser) window.location.hash = '#/verify-voter';
    else if (currentUser.hasVoted !== 1) window.location.hash = '#/vote';
  }, [currentUser]);

  if (!currentUser || currentUser.hasVoted !== 1) return null;

  const handleExit = (e) => {
    e.preventDefault();
    logout();
    window.location.hash = '#/verify-voter';
  };

  return (
    <main className="page-center">
      <div className="confirmed-card">
        <div className="green-stripe"></div>
        <div className="confirmed-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7"/>
          </svg>
        </div>
        <h1 className="confirmed-title">Vote Recorded</h1>
        <p className="confirmed-subtitle">Your ballot has been securely encrypted and deposited into the digital urn.</p>
        <div className="receipt-box">
          <div className="receipt-label">Confirmation Receipt</div>
          <div className="receipt-hash">{receiptHash}</div>
        </div>
        <p className="confirmed-thanks">Thank you for participating in the electoral process, {currentUser.username}.</p>
        <div className="confirmed-actions">
          <a href="#/logout" onClick={handleExit} className="btn-outline">Exit Session</a>
          <a href="#/results" className="btn-solid">View Live Results</a>
        </div>
      </div>
      <div className="page-footer">
        <div className="footer-title">Secure Voting System</div>
        <div className="footer-sub">Protected by end-to-end encryption. Your privacy is guaranteed.</div>
      </div>
    </main>
  );
}

// --- Live Results Tally ---
function Results() {
  const { candidates, voters, currentUser } = useSpendings();

  useEffect(() => {
    if (!currentUser) window.location.hash = '#/verify-voter';
  }, [currentUser]);

  if (!currentUser) return null;

  const parseCandidate = (fullName) => {
    const idx = fullName.lastIndexOf('(');
    return idx > 0 ? {
      name: fullName.substring(0, idx).trim(),
      party: fullName.substring(idx + 1, fullName.length - 1).trim()
    } : { name: fullName, party: '' };
  };

  const totalVotes = candidates.reduce((a, b) => a + b.vote_count, 0);
  const totalRegistered = voters.length;
  const turnout = totalRegistered > 0 ? (totalVotes / totalRegistered) * 100 : 0;
  const turnoutStr = turnout.toFixed(1) + '%';

  let projectedLeader = '—';
  let maxVotes = 0;
  candidates.forEach(c => {
    if (c.vote_count > maxVotes) {
      maxVotes = c.vote_count;
      projectedLeader = parseCandidate(c.name).name;
    }
  });

  return (
    <>
      <div className="results-header">
        <h1>Live Election Results</h1>
        <div className="live-badge"><span className="live-dot"></span> Live Feed Active</div>
      </div>
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-label">Turnout</div>
          <div className="stat-value">{turnoutStr}</div>
          <div className="stat-sub">of registered voters</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Total Votes Cast</div>
          <div className="stat-value">{totalVotes}</div>
          <div className="stat-sub">verified ballots</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Projected Leader</div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>{projectedLeader}</div>
          <div className="stat-sub">leading candidate</div>
        </div>
      </div>
      <div className="tally-section">
        <h2>Detailed Tally</h2>
        {candidates.map((c) => {
          const { name, party } = parseCandidate(c.name);
          const pct = totalVotes > 0 ? (c.vote_count / totalVotes) * 100 : 0;
          const pctStr = pct.toFixed(1) + '%';
          const isLeading = c.vote_count === maxVotes && c.vote_count > 0;
          return (
            <div key={c.id} className="tally-card">
              <div className="tally-header">
                <span className="tally-name">{name}</span>
                <span className="tally-percent">{pctStr}</span>
              </div>
              <div className="tally-party">{party}</div>
              <div className="tally-bar-track">
                <div className={`tally-bar-fill ${isLeading ? 'leading' : ''}`} style={{ width: pctStr }}></div>
              </div>
              <div className="tally-votes">{c.vote_count} vote{c.vote_count !== 1 ? 's' : ''}</div>
            </div>
          );
        })}
      </div>
    </>
  );
}

// ==========================================
// 4. MAIN ROUTER & APP CORE
// ==========================================
function AppContent() {
  const { loading, isSaving, currentUser, pendingVoter } = useSpendings();
  const [activePage, setActivePage] = useState('verify-voter');

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash.replace('#/', '') || 'verify-voter';
      if (['verify-voter', 'verify-otp', 'vote', 'confirmed', 'results'].includes(hash)) {
        setActivePage(hash);
      } else {
        window.location.hash = '#/verify-voter';
      }
    };
    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  useEffect(() => {
    if (loading) return;
    const hash = window.location.hash.replace('#/', '') || 'verify-voter';

    if (hash === 'verify-voter') {
      if (currentUser) {
        window.location.hash = currentUser.hasVoted === 1 ? '#/results' : '#/vote';
      }
    } else if (hash === 'verify-otp') {
      if (currentUser) {
        window.location.hash = currentUser.hasVoted === 1 ? '#/results' : '#/vote';
      } else if (!pendingVoter) {
        window.location.hash = '#/verify-voter';
      }
    } else if (hash === 'vote') {
      if (!currentUser) {
        window.location.hash = '#/verify-voter';
      } else if (currentUser.hasVoted === 1) {
        window.location.hash = '#/confirmed';
      }
    } else if (hash === 'confirmed') {
      if (!currentUser) {
        window.location.hash = '#/verify-voter';
      } else if (currentUser.hasVoted !== 1) {
        window.location.hash = '#/vote';
      }
    } else if (hash === 'results') {
      if (!currentUser) {
        window.location.hash = '#/verify-voter';
      }
    }
  }, [activePage, currentUser, pendingVoter, loading]);

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '16px', background: 'var(--bg)' }}>
        <div style={{ width: '32px', height: '32px', border: '2px solid var(--navy)', borderTopColor: 'transparent', borderRadius: '50%' }} className="animate-spin"></div>
        <p style={{ fontSize: '0.75rem', letterSpacing: '0.1em', fontFamily: 'Menlo, monospace', color: 'var(--ink-light)', textTransform: 'uppercase' }}>
          Loading electoral registry...
        </p>
      </div>
    );
  }

  const renderPage = () => {
    switch (activePage) {
      case 'verify-voter': return <VerifyVoter />;
      case 'verify-otp': return <VerifyOtp />;
      case 'vote': return <Vote />;
      case 'confirmed': return <Confirmed />;
      case 'results': return <Results />;
      default: return <VerifyVoter />;
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <Navbar />
      <div style={{ flexGrow: 1 }}>{renderPage()}</div>
      {isSaving && (
        <div style={{ position: 'fixed', bottom: '24px', right: '24px', background: 'var(--card)', border: '1px solid var(--border)', padding: '8px 16px', borderRadius: '9999px', fontSize: '10px', letterSpacing: '0.1em', fontFamily: 'Menlo, monospace', display: 'flex', alignItems: 'center', gap: '8px', boxShadow: 'var(--shadow-lg)', zIndex: 90 }} className="animate-pulse">
          <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--navy)', display: 'inline-block' }}></span>
          <span style={{ textTransform: 'uppercase', color: 'var(--navy)' }}>Encrypting Ballot...</span>
        </div>
      )}
    </div>
  );
}

export default function App() {
  return (
    <SpendingsProvider>
      <AppContent />
    </SpendingsProvider>
  );
}

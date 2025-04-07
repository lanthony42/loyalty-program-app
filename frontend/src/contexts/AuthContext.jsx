import React, { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null); 
    const navigate = useNavigate();

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (token) {
            fetchUserData(token);
        } else {
            setUser(null);
        }
    }, []);

    const fetchUserData = async (token) => {
        try {
            const response = await fetch(`${BACKEND_URL}/users/me`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setUser(data); 
            } else {
                throw new Error('Failed to fetch user data');
            }
        } catch (error) {
            console.error(error);
            setUser(null);
        }
    };

    const logout = () => {
        localStorage.removeItem('token'); 
        localStorage.removeItem('expiresAt'); 
        setUser(null); 
        navigate('/'); 
    };

    const login = async (utorid, password) => {
        try {
            const response = await fetch(`${BACKEND_URL}/auth/tokens`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ utorid, password }),
            });

            const data = await response.json();
            if (response.ok) {
                const { token, expiresAt } = data;
                localStorage.setItem('token', token); 
                localStorage.setItem('expiresAt', expiresAt); 
                fetchUserData(token); 
                navigate('/profile');
            } else {
                return data.message;
            }
        } catch (error) {
            console.error(error);
            return 'An error occurred while logging in';
        }
    };

    const register = async ({ utorid, name, email }) => {
        try {
            const token = localStorage.getItem('token');

            const response = await fetch(`${BACKEND_URL}/users`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({ utorid, name, email }),
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/success'); 
            } else {
                return data.message; 
            }
        } catch (error) {
            console.error(error);
            return 'An error occurred while registering';
        }
    };

    const update_user = async (userData) => {
        try {
            const token = localStorage.getItem('token');
            const formData = new FormData();
            for (const key in userData) {
                formData.append(key, userData[key]);
            }
            const response = await fetch(`${BACKEND_URL}/users/me`, {
                method: 'PATCH',
                headers: {
                    'Authorization': `Bearer ${token}`,
                },
                body: formData,
            });

            const data = await response.json();
            if (response.ok) {
                navigate('/profile');
            } else {
                return data.message;
            }
        } catch (error) {
            console.log(error);
            return 'An error occurred while updating';
        }
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, update_user }}>
            {children}
        </AuthContext.Provider>
    );
};

export const UseAuth = () => {
    return useContext(AuthContext);
};

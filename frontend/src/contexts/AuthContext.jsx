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
                setUser(data.user); 
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
        setUser(null); 
        navigate('/'); 
    };

    const login = async (username, password) => {
        try {
            const response = await fetch(`${BACKEND_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, password }),
            });

            const data = await response.json();
            if (response.ok) {
                const { token } = data;
                localStorage.setItem('token', token); 
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

    const register = async ({ username, firstname, lastname, password }) => {
        try {
            const response = await fetch(`${BACKEND_URL}/register`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ username, firstname, lastname, password }),
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

    return (
        <AuthContext.Provider value={{ user, login, logout, register }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

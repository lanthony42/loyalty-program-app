import "./form.css";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import config from "../config";

const UpdateUser = () => {
    const [error, setError] = useState("");
    const [data, setData] = useState({
        name: null,
        email: null,
        birthday: null,
        avatar: null
    });
    const navigate = useNavigate();

    const { authReady, token, user } = useAuth();
    if (!authReady) {
        return <p>Loading...</p>;
    }
    else if (!user) {
        return <Navigate to="/login" replace />;
    }

    const handleChange = e => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handleFileChange = e => {
        const file = e.target.files[0];
        if (file) {
            setData({ ...data, avatar: file });
        }
    };    

    const handleSubmit = async e => {
        e.preventDefault();

        try {
            const url = `${config.backendUrl}/users/me`;
            const formData = new FormData();
            for (const key in data) {
                if (data[key]) {
                    formData.append(key, data[key]);
                }
            }
            const response = await fetch(url, {
                method: "PATCH",
                headers: {
                    "Authorization": `Bearer ${token}`,
                },
                body: formData,
            });

            if (response.ok) {
                navigate("/profile");
            }
            else {
                const json = await response.json();
                setError(json.error);
            }
        }
        catch (error) {
            console.error(error);
            setError("An error occurred while updating");
        }
    };

    return <>
        <h2>Update Your Information</h2>
        <form onSubmit={handleSubmit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={data.name || ""}
                onChange={handleChange}
            />
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={data.email || ""}
                onChange={handleChange}
            />
            <label htmlFor="birthday">Birthday:</label>
            <input
                type="date"
                id="birthday"
                name="birthday"
                placeholder="Birthday"
                value={data.birthday || ""}
                onChange={handleChange}
            />
            <label htmlFor="avatar">Avatar:</label>
            <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handleFileChange}
            />
            <div className="btn-container">
                <button type="submit">Update</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
};

export default UpdateUser;

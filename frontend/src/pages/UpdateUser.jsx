import "./form.css";
import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";

function UpdateUser() {
    const { update_user } = useAuth();    
    const [error, setError] = useState("");
    const [data, setData] = useState({
        name: null,
        email: null,
        birthday: null,
        avatar: null
    });

    const handle_change = (e) => {
        const { name, value } = e.target;
        setData({ ...data, [name]: value });
    };

    const handle_file_change = (e) => {
        const file = e.target.files[0];
        if (!file) return;

        setData({ ...data, avatar: file }); // Save the file, not the URL
    };
    

    const handle_submit = (e) => {
        e.preventDefault();
        update_user(data)
        .then(message => setError(message));
    };

    return <>
        <h2>Update Your Information</h2>
        <form onSubmit={handle_submit}>
            <label htmlFor="name">Name:</label>
            <input
                type="text"
                id="name"
                name="name"
                placeholder="Name"
                value={data.name || ""}
                onChange={handle_change}
            />
            <label htmlFor="email">Email:</label>
            <input
                type="email"
                id="email"
                name="email"
                placeholder="Email"
                value={data.email || ""}
                onChange={handle_change}
            />
            <label htmlFor="birthday">Birthday:</label>
            <input
                type="date"
                id="birthday"
                name="birthday"
                placeholder="Birthday"
                value={data.birthday || ""}
                onChange={handle_change}
            />
            <label htmlFor="avatar">Avatar:</label>
            <input
                type="file"
                id="avatar"
                name="avatar"
                accept="image/*"
                onChange={handle_file_change}
            />
            <div className="btn-container">
                <button type="submit">Update</button>
            </div>
            <p className="error">{error}</p>
        </form>
    </>;
}

export default UpdateUser;

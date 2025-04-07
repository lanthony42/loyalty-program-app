import "./main.css";
import { Link } from "react-router-dom";

function Home() {
    return <>
        <h2>Welcome!</h2>
        <div className="row">
            <Link to="/login">Login</Link>
        </div>
    </>;
}

export default Home;

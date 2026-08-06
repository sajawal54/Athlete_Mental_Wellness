import { Link, useNavigate } from "react-router-dom";
import { FiLogOut, FiHome, FiUser, FiMenu } from "react-icons/fi";
import { useDispatch, useSelector } from "react-redux";
import { useState } from "react";

import { logout } from "../redux/slices/authSlice";

function Navbar() {

    const dispatch = useDispatch();
    const navigate = useNavigate();

    const [menuOpen, setMenuOpen] = useState(false);

    const { user } = useSelector(state => state.auth);

    const handleLogout = () => {

        dispatch(logout());

        navigate("/login");

    };

    return (

        <nav className="bg-white shadow-md">

            <div className="max-w-7xl mx-auto px-6">

                <div className="flex justify-between items-center h-16">

                    {/* Logo */}

                    <Link
                        to="/dashboard"
                        className="text-2xl font-bold text-indigo-600"
                    >

                        Athlete Wellness

                    </Link>

                    {/* Desktop Menu */}

                    <div className="hidden md:flex items-center gap-8">

                        <Link
                            to="/dashboard"
                            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                        >

                            <FiHome />

                            Dashboard

                        </Link>

                        <Link
                            to="/profile"
                            className="flex items-center gap-2 text-gray-700 hover:text-indigo-600"
                        >

                            <FiUser />

                            Profile

                        </Link>

                        <button

                            onClick={handleLogout}

                            className="flex items-center gap-2 bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"

                        >

                            <FiLogOut />

                            Logout

                        </button>

                    </div>

                    {/* Mobile */}

                    <button

                        className="md:hidden"

                        onClick={() => setMenuOpen(!menuOpen)}

                    >

                        <FiMenu size={25} />

                    </button>

                </div>

                {

                    menuOpen &&

                    <div className="md:hidden pb-4">

                        <Link

                            to="/dashboard"

                            className="block py-2"

                        >

                            Dashboard

                        </Link>

                        <Link

                            to="/profile"

                            className="block py-2"

                        >

                            Profile

                        </Link>

                        <button

                            onClick={handleLogout}

                            className="text-red-500 mt-3"

                        >

                            Logout

                        </button>

                    </div>

                }

            </div>

        </nav>

    );

}

export default Navbar;


function Navbar () {
    return (
        <nav className="navbar navbar-expand-lg navbr-lg bg-light">
            <a href="#" className="navbar-brand">consequences</a>
            <div className="collapse navbar-collapse" id="navbarSupportedContent">
                <ul className="navbar-nav mr-auto">
                <li className="nav-item active">
                    <a className="nav-link" href="#about">About <span className="sr-only">(current)</span></a>
                </li>
                <li className="nav-item">
                    <a className="nav-link" href="#">play</a>
                </li>
                </ul>
            </div>
        </nav>
    )
}

export default Navbar;
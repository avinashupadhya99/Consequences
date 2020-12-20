

function Navbar () {
    return (
        <nav class="navbar navbar-expand-lg navbr-lg bg-light">
            <a href="#" class="navbar-brand">consequences</a>
            <div class="collapse navbar-collapse" id="navbarSupportedContent">
                <ul class="navbar-nav mr-auto">
                <li class="nav-item active">
                    <a class="nav-link" href="#about">About <span class="sr-only">(current)</span></a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="#">play</a>
                </li>
                </ul>
            </div>
        </nav>
    )
}

export default Navbar;
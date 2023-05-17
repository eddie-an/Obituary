import React from 'react';

function Header({ setPopupState }) {
    return (
    <nav className='header-container'>
        <div className='title-container'>
            <h1>The Last Show</h1>
        </div>  
        <div className='add-button-container'>
            <button onClick={ () => setPopupState(true) }>+ New Obituary</button>
        </div>
    </nav>
    );
}

export default Header;
import React from 'react';

function Content({ obituaryCollection, descriptionState, setDescriptionState }) {
    
    //globl for only allowing one audio to play at a time
    let isAnyPlaying = false;
    
    /**
     * This function changes the boolean value of descriptionState at the specified index
     * Used to hide and unhide the description of the obituary when a button is clicked
     * @param {int} indexArg index of the descriptionState array
     */
    function collapseOrExpandItem(indexArg) {
        const array = descriptionState.map((element, index) =>
            {
                if (index === indexArg) {
                    return (element = !element);
                }
                else {
                    return (element);
                }
            }
        );
        setDescriptionState(array);
    }


    const monthKeyValue = {
        '01': 'January',
        '02': 'February',
        '03': 'March',
        '04': 'April',
        '05': 'May',
        '06': 'June',
        '07': 'July',
        '08': 'August',
        '09': 'September',
        '10': 'October',
        '11': 'November',
        '12': 'December',
    };

    /**
     * This method returns the contents of the obituaryCollection array wrapped in JSX
     * Used to display the content on the website when called
     * @param {int} columnNumber Specifies the number of column divs on the website. It is set to 4 by default.
     *                           Varies depending on the width of the website viewport.
     * @param {int} totalColumn  Specifies the column div on HTML. It can be anywhere from 0 to totalColumn-1
     * @returns array of JSX items
     */
    function displayObituary() {
        let contentList = [];

        obituaryCollection.map((obituary, index) => {
            const birthDateArray = obituary['birth date'].split("-");
            const deathDateArray = obituary['death date'].split("-");
            const birthMonth = monthKeyValue[birthDateArray[1]];
            const deathMonth = monthKeyValue[deathDateArray[1]];
            const formattedBirthDate = birthMonth + " " + birthDateArray[2] + ", " + birthDateArray[0];
            const formattedDeathDate = deathMonth + " " + deathDateArray[2] + ", " + deathDateArray[0];
            const audioLink = obituary['speech'];
            const audio = new Audio(audioLink);
            let isPlaying = false;

            /**
             * This function toggle the audio file to play or pause for the obituary when called
             */
            function togglePlay(audio) {
                if (isAnyPlaying) {
                    audio.pause();
                }
                else  {
                    isPlaying ? audio.pause() : audio.play();
                }
                
            };

            audio.onplaying = function() {
                isPlaying = true;
                isAnyPlaying = true;
            };
            
            audio.onpause = function() {
                isPlaying = false;
                isAnyPlaying = false;
            };

            contentList.push(
            <div className='grid-item' key={index}>
                <div className='item-container'>
                    <button className='item-container-button' onClick ={() => collapseOrExpandItem(index)}>
                        <img className='item-image' src={obituary['image']} alt={`${obituary['name']}`} />
                        <div className='item-header-container'>
                            <h4 className='item-name'>{obituary['name']}</h4>
                            <p className='item-date'>{formattedBirthDate} - {formattedDeathDate}</p>
                        </div>
                        <div className={`item-description-container ${descriptionState[index] === true ? "": "hidden"}`}>
                            <p>{obituary['description']}</p>
                        </div>
                    </button>
                    <div className={`item-audio-container ${descriptionState[index] === true ? "": "hidden"}`}>
                        <button className="item-audio-button" onClick={() => togglePlay(audio)}>&#x23EF;</button>
                    </div>
                </div>
            </div>
            );
        });
        return contentList;  
    }

    return (
    <div className='grid-container'>
        {displayObituary()}
    </div>
    );
}

export default Content;
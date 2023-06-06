import React from 'react';
import { useState } from 'react';


function CreateObituaryPopup( {setPopupState, setObituaryCollection, obituaryCollection, descriptionState, setDescriptionState} ) {

    const [ name, setName ] = useState("");
    const [ birthDate, setBirthDate] = useState();
    const [ deathDate, setDeathDate] = useState();
    const [selectedFile, setSelectedFile] = useState(null);


    /**
     * This function sends the user input in a binary format and sends it to the specified Lambda URL
     * @param {Event} e
     */
    const handleSubmit = async (e) => { // Add lambda url
        e.preventDefault(); // Prevents the popup page from closing before event is handled
        const submitButton = document.getElementById('submit-button');

        submitButton.setAttribute("disabled", "disabled");
        submitButton.classList.add("disabled-submit-button");
        submitButton.setAttribute("value", "Please wait. It's not like they are gonna be late for something...");
        const dataToSubmit = new FormData();
        dataToSubmit.append("name", name);
        dataToSubmit.append("birth date", birthDate);
        dataToSubmit.append("death date", deathDate);
        dataToSubmit.append("file", selectedFile);
        const submitTime = Date.now();
        dataToSubmit.append("submit time", submitTime);
        const promise = await fetch(
            "https://gmezgvtvdwsdv54jmp4gyfaetq0qlszq.lambda-url.ca-central-1.on.aws/", // Lambda Function URL (needs to be hard coded)
            {
                method: "POST",
                body: dataToSubmit,
            }
        );
        const jsonPromise = await promise.json(); // Used to access the body of the returned Json

        let alreadyExists = false; // Looks for duplicate names in the collection
        for (let i=0; i<obituaryCollection.length; i++)
        {
            if (obituaryCollection[i]['name'] === name)
            {
                alreadyExists = true;
                break;
            }
        }

        if (promise.status === 200) // Successful POST request
        {
            const newObituary = {
                'name': name,
                'birth date': birthDate,
                'death date': deathDate,
                'description': jsonPromise['description'],
                'image': jsonPromise['image'],
                'speech': jsonPromise['speech'],
                'submit time': submitTime
            }
            setObituaryCollection([newObituary,...obituaryCollection]); // Update obituaryCollection
            setDescriptionState([true,...descriptionState]); // Most recently added obituary is open by default

            if (alreadyExists === true) { // when an obituary with duplicate name is added
                window.alert(`There already exists an obituary for ${name}.\nThe old obituary will be deleted upon refresh.`);
            }
        }
        else { // Unsuccessful POST request
            window.alert(`Error! status ${promise.status}\n${jsonPromise["message"]}`);
        }
        setPopupState(false); // Close the overlay
    }
    
    
    return (
        <div className='popup-container'>
            <div className='popup-title-container'>
                <h1>Create a New Obituary</h1>
            </div>
            <div className='floral-design-container'>
                <img src={"https://www.documentsanddesigns.com/media/view/Vignettes-35.gif"} 
                alt={"Vignette"} ></img>
            </div>

            <form onSubmit={ (e) => handleSubmit(e) }>
                <div className='image-upload-container'>
                    <label htmlFor='imageUploads' id='imageUploadsLabel'>Select an image for the deceased</label>
                    {selectedFile !== null && selectedFile !== undefined ? <b> ({selectedFile.name})</b>: ""}
                    <input
                    type="file" 
                    id='imageUploads' 
                    accept='image/*'
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                    required
                    />
                </div>
                <div className='name-container'>
                    <input className='name-input' type="text" placeholder="Name of the deceased" onChange={ (e) => setName(e.target.value) } required/>
                </div>
                <div className='calendar-container'>
                    <p id='born'>Born:</p>
                    <input 
                        type="date" 
                        className="calendar"
                        onChange={(e) => setBirthDate(e.target.value)}
                        required
                    />
                    <p id='died'>Died:</p>
                    <input 
                        type="date" 
                        className="calendar"
                        onChange={(e) => setDeathDate(e.target.value)}
                        required
                    />
                </div>
                <div className='submit-button-container'>
                    <input type="submit" id='submit-button' value="Write Obituary" />
                </div>
            </form>


            <div className='close-button-container'> 
                <button onClick={ () => setPopupState(false) }>X</button>
            </div>
        </div>
        );
}

export default CreateObituaryPopup;
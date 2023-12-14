import Header from "./components/Header";
import NoContent from "./components/NoContent";
import Content from "./components/Content";
import CreateObituaryPopup from "./components/CreateObituaryPopup";
import React, { useState, useEffect } from "react";

function App() {
  const [ obituaryCollection, setObituaryCollection ] = useState([]); 
  const [ popupState, setPopupState] = useState(false); // State of the popup menu for create obituary overlay
  const [ descriptionState, setDescriptionState ] = useState([]); // Specifies whether the obituary is open or closed
  
  const loadObituary = async () => {
    const res = await fetch(
        "https://54jrxpxn6f3hmnb22u2zzd2ydq0kuyzm.lambda-url.ca-central-1.on.aws/", // Lambda Function URL (needs to be hard coded)
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json"
          },
        }
      );

      const jsonRes = await res.json();
      if (res.status === 200)
      {
        // the obituary items are ordered by submit time
        jsonRes["obituary"]["Items"].sort((a, b) => {
          if (a['submit time'] > b['submit time']) {
            return -1;
          }
          if (a['submit time'] < b['submit time']) {
            return 1;
          }
          return 0;
        });

        setObituaryCollection([...jsonRes["obituary"]["Items"]]);
        setDescriptionState(Array(jsonRes["obituary"]["Items"]["length"]).fill(false));
      }
      else
      {
        window.alert(`Error! status ${res.status}\n${jsonRes["message"]}`);
      }
    }
    
    useEffect(()=> {
      loadObituary();
    }, []);


  return (
    <>
      <Header setPopupState = { setPopupState }/>
      <div className='body-container'>
        {obituaryCollection.length === 0 ? 
        <NoContent />
        :
        <Content obituaryCollection = {obituaryCollection}
        descriptionState = {descriptionState}
        setDescriptionState = {setDescriptionState }
        />
        }
        </div>
       {popupState? 
        <CreateObituaryPopup setPopupState = { setPopupState }
        setObituaryCollection={setObituaryCollection}
        obituaryCollection = {obituaryCollection}
        descriptionState = {descriptionState}
        setDescriptionState = {setDescriptionState }/>
        :
        <></>
      }
    </>
  );
}
export default App;

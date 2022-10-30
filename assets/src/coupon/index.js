import React, {useEffect, useState, useRef} from "react";
import {render} from 'react-dom';
import {CouponTabPanel} from './elements/CouponTabPanel.js';
import './style.scss';
import {HiddenInputFields} from "./elements/HiddenInputFields.js";


const YatraCouponTabPanel = () => {
    const [modifiedSettings, setModifiedSettings] = useState({});
    const [modifiedSettingsString, setModifiedSettingsString] = useState("");

    const updateModifiedSettings = (setting_name, setting_value) => {
        modifiedSettings[setting_name] = setting_value;
        setModifiedSettings(modifiedSettings);
        setModifiedSettingsString(JSON.stringify(modifiedSettings));

    }
    return (<>
            <CouponTabPanel setModifiedSettings={updateModifiedSettings} modifiedSettings={modifiedSettings}/>
            <HiddenInputFields modifiedSettings={modifiedSettings}/>
        </>
    )
};

window.addEventListener("load", function () {
    render(
        <YatraCouponTabPanel/>,
        document.getElementById("yatra-coupon-meta-element")
    );


});
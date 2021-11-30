import * as React from 'react';
import Tooltip from "../components/tooltip";
import {DateTimePicker, Popover, Button, PanelRow} from '@wordpress/components';
import {useState} from '@wordpress/element';
import {dateI18n} from '@wordpress/date';
import NumberInput from "./NumberInput";
import TextInput from "./TextInput";
import Select from "./Select";

type DateTimeProps = {
    settings: Setting
}
type Setting = {
    title: string,
    desc: string,
    desc_tip: boolean,
    name: string,
    type: string,
    value: string,
    placeholder: string
}

const DateTime = (props: DateTimeProps) => {

    const {settings} = props;
    console.log(settings);
    const [openDatePopup, setOpenDatePopup] = useState(false);
    const [dateValue, setDateValue] = useState(settings.value);
    const isInvalidDate = (to_date) => {
        var to = new Date(to_date);
        var today = currentDate();

        if (to.getTime() >= today.getTime()) {
            return false;
        }
        return true;

    }
    const currentDate = () => {
        return new Date();
    }

    return (
        <div className="yatra-field-wrap">
            <label
                htmlFor={settings.name}>{settings.title} </label>
            <input className="widefat" id={settings.name}
                   name={settings.name} type="text" value={dateValue === '' ? "" : dateI18n('F j, Y g:i a', dateValue)}
                   placeholder={settings.placeholder}/>

            <Button isLink={true} onClick={() => setOpenDatePopup(!openDatePopup)}>
                {dateValue === '' ? "Pick Date & Time" : dateI18n('F j, Y g:i a', dateValue)}

            </Button>
            {openDatePopup && (
                <Popover onClose={setOpenDatePopup.bind(null, false)}>
                    <DateTimePicker
                        currentDate={currentDate()}
                        initialOpen={false}
                        onChange={setDateValue}
                        isInvalidDate={isInvalidDate}
                        is12Hour={true}/>
                </Popover>
            )}

            {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
        </div>
    );
};
export default DateTime
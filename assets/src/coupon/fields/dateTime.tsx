import * as React from 'react';
import Tooltip from "../components/tooltip";
// @ts-ignore
import {DateTimePicker, Popover, Button} from '@wordpress/components';
import {useState} from '@wordpress/element';
import {dateI18n} from '@wordpress/date';

type DateTimeProps = {
    settings: Setting,
    fieldChange: (name: string, value: any) => {},
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

    const {settings, fieldChange} = props;
    const [openDatePopup, setOpenDatePopup] = useState(false);
    const [dateValue, setDateValue] = useState(settings.value);
    const isInvalidDate = (to_date: Date) => {
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

    const handleInputChange = (date_value: string) => {
        setDateValue(date_value);
        fieldChange(settings.name, date_value)
    }

    return (
        <div className="yatra-field-wrap">
            <label
                htmlFor={settings.name}>{settings.title} </label>
            <input className="widefat" id={settings.name}
                   type="hidden"
                   value={dateValue === '' ? "" : dateValue}
                   placeholder={settings.placeholder}/>

            <Button isLink={true} onClick={() => setOpenDatePopup(!openDatePopup)}>
                {dateValue === '' ? "Pick Date & Time" : dateI18n('F j, Y g:i a', dateValue, false)}

            </Button>
            {openDatePopup && (
                <Popover onClose={setOpenDatePopup.bind(null, false)}>
                    <DateTimePicker
                        currentDate={currentDate()}
                        initialOpen={false}
                        onChange={handleInputChange}
                        isInvalidDate={isInvalidDate}
                        is12Hour={true}/>
                </Popover>
            )}
            {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
        </div>
    );
};
export default DateTime
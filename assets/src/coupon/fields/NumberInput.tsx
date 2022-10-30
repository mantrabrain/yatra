import * as React from 'react';
import Tooltip from "../components/tooltip";
import {ChangeEvent} from 'react';


type NumberProps = {
    settings: Setting,
    fieldChange: (name: string, value: any) => {},
}

type Setting = {
    title: string,
    desc: string,
    desc_tip: boolean,
    name: string,
    type: string,
    value: number,
    placeholder: string
}
const NumberInput = (props: NumberProps) => {
    const {settings, fieldChange} = props;
    const handleInputChange = (event: ChangeEvent<{ value: string }>) => {
        let value = event?.currentTarget?.value;
        // @ts-ignore
        fieldChange(settings.name, value)

    }
    return (
        <div className="yatra-field-wrap"><label
            htmlFor={settings.name}>{settings.title} </label>
            <input className="yatra-input" id={settings.name}
                   type="number" defaultValue={settings.value} placeholder={settings.placeholder}
                   onChange={handleInputChange}/>
            {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
        </div>
    );
};
export default NumberInput
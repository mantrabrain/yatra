import * as React from 'react';
import Tooltip from "../components/tooltip";

type NumberProps = {
    settings: Setting
}

type Setting = {
    title: string,
    description: string,
    desc_tip: boolean,
    id: string,
    type: string,
    value: number,
    placeholder: string
}
const NumberInput = (props: NumberProps) => {
    const {settings} = props;
    return (
        <div className="yatra-field-wrap"><label
            htmlFor={settings.id}>{settings.title} </label>
            <input className="yatra-input" id={settings.id}
                   name={settings.id} type="number" defaultValue={settings.value} placeholder={settings.placeholder}/>
            <Tooltip/>
        </div>
    );
};
export default NumberInput
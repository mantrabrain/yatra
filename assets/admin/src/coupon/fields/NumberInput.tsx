import * as React from 'react';
import Tooltip from "../components/tooltip";

type NumberProps = {
    settings: Setting
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
    const {settings} = props;
    return (
        <div className="yatra-field-wrap"><label
            htmlFor={settings.name}>{settings.title} </label>
            <input className="yatra-input" id={settings.name}
                   name={settings.name} type="number" defaultValue={settings.value} placeholder={settings.placeholder}/>
            {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
        </div>
    );
};
export default NumberInput
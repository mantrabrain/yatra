import * as React from 'react';
// @ts-ignore
import {SelectControl} from "@wordpress/components";
import Tooltip from "../components/tooltip";
import NumberInput from "./NumberInput";
import TextInput from "./TextInput";
import {ChangeEvent} from 'react';


type SelectProps = {
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
    placeholder: string,
    options: Object,
}

export default class Select extends React.Component<SelectProps> {
    render() {

        const getOptions = (setting_options: Object) => {
            let options: { label: string; value: string; }[] = [];
            Object.entries(setting_options).forEach(
                ([option_key, option_value]) => options.push(
                    {label: option_value, value: option_key}
                )
            );

            return options;
        }

        const {settings, fieldChange} = this.props;

        const handleInputChange = (value: string) => {
            fieldChange(settings.name, value)
        }
        return (
            <div className="yatra-field-wrap"><label
                htmlFor={settings.name}>{settings.title} </label>
                <SelectControl
                    defaultValue={settings.value}
                    name={settings.name}
                    options={getOptions(settings.options)} onChange={handleInputChange}
                />
                {settings.desc_tip ? <Tooltip content={settings.desc}/> : ''}
            </div>
        );
    }
}
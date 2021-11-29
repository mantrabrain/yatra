import * as React from 'react';
// @ts-ignore
import {SelectControl} from "@wordpress/components";
import Tooltip from "../components/tooltip";
import NumberInput from "./NumberInput";
import TextInput from "./TextInput";


type SelectProps = {
    settings: Setting
}

type Setting = {
    title: string,
    description: string,
    desc_tip: boolean,
    id: string,
    type: string,
    value: string,
    placeholder: string,
    options: Object,
}

export default class Select extends React.Component<SelectProps> {
    render() {

        const getOptions = (setting_options: Object) => {
            console.log(typeof setting_options);
            let options: { label: unknown; value: string; }[] = [];
            Object.entries(setting_options).forEach(
                ([option_key, option_value]) => options.push(
                    {label: option_value, value: option_key}
                )
            );

            return options;
        }
        const {settings} = this.props;
        return (
            <div className="yatra-field-wrap"><label
                htmlFor={settings.id}>{settings.title} </label>
                <SelectControl
                    defaultValue={settings.value}
                    name={settings.id}
                    options={getOptions(settings.options)}
                />
                <Tooltip/>
            </div>
        );
    }
}
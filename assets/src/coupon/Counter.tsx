import * as React from 'react';

export default class Counter extends React.Component {
    state = {
        count: 0
    };
    increment = () => {
        this.setState({
            count: (this.state.count + 1)
        });
    };

    decrement = () => {
        this.setState({
            count: (this.state.count - 1)
        });
    };

    render() {
        return (
            <div>
                <h1>{this.state.count}</h1>
                <button type="button" onClick={this.increment}>Increment</button>
                <button type="button" onClick={this.decrement}>Decrement</button>
            </div>
        );
    }
}

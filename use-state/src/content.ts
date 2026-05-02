// @ts-ignore
import { useState } from 'rffp';

export function AppContent() {
    const { setState } = useState("paragraph");

    console.log("Rendering AppContent");

    setTimeout(() => {
        setState("This is the updated paragraph content!");
    }, 5000)

    return `
        <div>
            <h1>Understanding React from first principles!</h1>
            <p id="paragraph"></p>
        </div>
    `
}
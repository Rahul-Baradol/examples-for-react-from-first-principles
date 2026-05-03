// @ts-ignore
import { useState, useEffect } from 'rffp';

export function AppContent() {
    const { stateId, setState } = useState("paragraph");

    console.log("Rendering AppContent");

    setTimeout(() => {
        setState("This is the updated paragraph content!");
    }, 5000);

    useEffect(() => {
        const reservedElement = document.getElementById("reserved");
        reservedElement.innerHTML = "Let's goo, first useEffect is working!!";
    }, [stateId]);

    useEffect(() => {
        const reservedElement = document.getElementById("reserved-2");
        reservedElement.innerHTML = "Let's goo, second useEffect is working!!";
    }, [stateId]);

    return `
        <div>
            <h1>Understanding React from first principles!</h1>
            <p id="paragraph"></p>
            <p id="reserved"></p>
            <p id="reserved-2"></p>
        </div>
    `
}
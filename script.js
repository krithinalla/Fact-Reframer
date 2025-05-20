// This file has been replaced by the React implementation
// Keeping this as a reference for the original implementation

document.addEventListener('DOMContentLoaded', () => {
    const getFactBtn = document.getElementById('get-fact-btn');
    const factDisplayArea = document.getElementById('fact-display-area');
    const subjectButtonsContainer = document.getElementById('subject-buttons-container');
    const loadingIndicator = document.getElementById('loading-indicator');
    const errorMessage = document.getElementById('error-message');

    let currentFactText = '';
    const subjects = ["Mathematics", "Art History", "Geography", "Chemistry", "Literature"]; // Example subjects

    // --- API Functions (Calling Backend) ---
    async function getInitialFact() {
        // Add a timestamp to prevent caching
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/getInitialFact?t=${timestamp}`, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to parse error
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.fact) {
            throw new Error("Invalid response from server: missing 'fact'.");
        }
        return data.fact;
    }

    async function reframeFactWithLens(textToReframe, subjectLens) {
        const response = await fetch('/api/reframeFact', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify({ textToReframe, subjectLens })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({})); // Try to parse error
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        if (!data.reframedText) {
            throw new Error("Invalid response from server: missing 'reframedText'.");
        }
        return data.reframedText;
    }

    // --- UI Helper Functions ---
    function showLoading() {
        loadingIndicator.style.display = 'block';
        errorMessage.style.display = 'none';
    }

    function hideLoading() {
        loadingIndicator.style.display = 'none';
    }

    function showError(message) {
        errorMessage.textContent = `Error: ${message}`;
        errorMessage.style.display = 'block';
        hideLoading();
    }

    function hideError() {
        errorMessage.style.display = 'none';
    }

    function displayFact(text, isInitial = false) {
        const p = document.createElement('p');
        p.textContent = text;
        if (isInitial) {
            factDisplayArea.innerHTML = ''; // Clear previous facts if it's the initial one
        }
        factDisplayArea.appendChild(p);
        currentFactText = text; // Update the current text state
        factDisplayArea.style.display = 'block'; // Ensure display area is visible
    }

    function displaySubjectButtons() {
        subjectButtonsContainer.innerHTML = ''; // Clear existing buttons
        subjects.forEach(subject => {
            const button = document.createElement('button');
            button.textContent = subject;
            button.dataset.subject = subject; // Store subject in data attribute
            subjectButtonsContainer.appendChild(button);
        });
        subjectButtonsContainer.style.display = 'flex'; // Make buttons visible
    }

    // --- Event Listeners ---
    getFactBtn.addEventListener('click', async () => {
        showLoading();
        hideError();
        getFactBtn.disabled = true; // Disable button while fetching

        try {
            const fact = await getInitialFact();
            displayFact(fact, true); // Display the initial fact
            displaySubjectButtons(); // Show subject buttons
        } catch (error) {
            showError(error.message || "Could not retrieve fact.");
        } finally {
            hideLoading();
            getFactBtn.disabled = false; // Re-enable the button
        }
    });

    subjectButtonsContainer.addEventListener('click', async (event) => {
        if (event.target.tagName === 'BUTTON') {
            const selectedSubject = event.target.dataset.subject;
            if (!selectedSubject || !currentFactText) return; // Safety check

            showLoading();
            hideError();
            // Disable all subject buttons during processing
            Array.from(subjectButtonsContainer.children).forEach(btn => btn.disabled = true);

            try {
                const reframedText = await reframeFactWithLens(currentFactText, selectedSubject);
                displayFact(reframedText, false); // Append the reframed fact
            } catch (error) {
                showError(error.message || `Could not reframe with ${selectedSubject}.`);
            } finally {
                hideLoading();
                 // Re-enable all subject buttons
                Array.from(subjectButtonsContainer.children).forEach(btn => btn.disabled = false);
            }
        }
    });

}); 
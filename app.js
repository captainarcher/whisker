document.addEventListener('DOMContentLoaded', function () {
    const fileInput = document.getElementById('fileInput');
    const saveMdBtn = document.getElementById('saveMdBtn');
    const convertPdfBtn = document.getElementById('convertPdfBtn');
    const markdownEditor = document.getElementById('markdownEditor');

    if (fileInput) {
        fileInput.addEventListener('change', handleFileSelect);
    } else {
        console.error("Element with ID 'fileInput' not found.");
    }

    if (saveMdBtn) {
        saveMdBtn.addEventListener('click', saveMarkdown);
    } else {
        console.error("Element with ID 'saveMdBtn' not found.");
    }

    if (convertPdfBtn) {
        convertPdfBtn.addEventListener('click', convertToPdf);
    } else {
        console.error("Element with ID 'convertPdfBtn' not found.");
    }

    if (markdownEditor) {
        markdownEditor.addEventListener('input', updatePreview);
    } else {
        console.error("Element with ID 'markdownEditor' not found.");
    }
});

function updatePreview() {
    const editorContent = document.getElementById('markdownEditor').value;
    document.getElementById('preview').innerHTML = marked.parse(editorContent);
}

function formatText(command) {
    const editor = document.getElementById('markdownEditor');
    const start = editor.selectionStart;
    const end = editor.selectionEnd;
    const selectedText = editor.value.substring(start, end);
    let formattedText;

    switch (command) {
        case 'bold':
            formattedText = `**${selectedText}**`;
            break;
        case 'italic':
            formattedText = `*${selectedText}*`;
            break;
        case 'underline':
            formattedText = `<u>${selectedText}</u>`;
            break;
        case 'heading':
            formattedText = `# ${selectedText}`;
            break;
        case 'bullet':
            formattedText = `- ${selectedText}`;
            break;
        case 'indent':
            formattedText = `    ${selectedText}`;
            break;
        default:
            formattedText = selectedText;
    }

    editor.setRangeText(formattedText, start, end, 'end');
    updatePreview();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) {
        alert("No file selected.");
        return;
    }

    // Validate file type and extension
    if (file.type !== 'text/markdown' && !file.name.endsWith('.md')) {
        alert("Please select a valid markdown file (.md).");
        return;
    }

    // Read the file using FileReader
    const reader = new FileReader();
    reader.onload = function (e) {
        let content = e.target.result;
        // Log the content for debugging
        console.log("File content before sanitization:", content);
        content = stripCodeFromMarkdown(content);
        // Log the content after stripping code
        console.log("File content after stripping code:", content);
        if (validateMarkdown(content)) {
            // Display content in the editor
            const markdownEditor = document.getElementById('markdownEditor');
            if (markdownEditor) {
                markdownEditor.value = DOMPurify.sanitize(content);
                updatePreview();
            } else {
                console.error("Element with ID 'markdownEditor' not found.");
            }
        } else {
            alert("The markdown content is invalid.");
        }
    };
    reader.readAsText(file);
}

function saveMarkdown() {
    try {
        const markdownEditor = document.getElementById('markdownEditor');
        if (markdownEditor) {
            let markdownContent = markdownEditor.value;
            markdownContent = stripCodeFromMarkdown(markdownContent);
            if (validateMarkdown(markdownContent)) {
                const blob = new Blob([DOMPurify.sanitize(markdownContent)], { type: 'text/markdown' });
                saveAs(blob, 'edited-file.md');
            } else {
                alert("The markdown content is invalid.");
            }
        } else {
            console.error("Element with ID 'markdownEditor' not found.");
        }
    } catch (error) {
        console.error("Error saving markdown:", error);
        alert("An error occurred while saving the markdown file.");
    }
}

function convertToPdf() {
    try {
        const { jsPDF } = window.jspdf;
        const html2canvas = window.html2canvas;

        const markdownEditor = document.getElementById('markdownEditor');
        if (markdownEditor) {
            let markdownContent = markdownEditor.value;
            markdownContent = stripCodeFromMarkdown(markdownContent);

            if (validateMarkdown(markdownContent)) {
                // Use marked to convert markdown to HTML
                const htmlContent = DOMPurify.sanitize(marked.parse(markdownContent));

                // Create a new jsPDF instance
                const pdf = new jsPDF('p', 'mm', 'a4'); // 'p' for portrait, 'mm' for millimeters, 'a4' for paper size

                // Use a container element to hold the HTML content
                const container = document.createElement('div');
                container.classList.add('pdf-content'); // Apply styling
                container.innerHTML = htmlContent;

                // Apply temporary styles for PDF generation
                container.style.color = '#000'; // Black text
                container.style.backgroundColor = '#fff'; // White background

                // Append container to body to ensure it's rendered
                document.body.appendChild(container);

                // Use html2pdf to render the HTML content
                html2pdf().from(container).set({
                    margin: 10, // Adjusted margin for better spacing
                    filename: 'converted-file.pdf',
                    html2canvas: {
                        scale: 2, // Increase scale for better resolution
                        useCORS: true // Allow cross-origin images
                    },
                    jsPDF: {
                        unit: 'mm',
                        format: 'a4',
                        orientation: 'portrait' // 'p' for portrait
                    }
                }).save().then(() => {
                    // Remove the container after rendering
                    document.body.removeChild(container);
                });
            } else {
                alert("The markdown content is invalid.");
            }
        } else {
            console.error("Element with ID 'markdownEditor' not found.");
        }
    } catch (error) {
        console.error("Error converting to PDF:", error);
        alert("An error occurred while converting the markdown to PDF.");
    }
}

function insertMarkdown(markdown) {
    const editor = document.getElementById('markdownEditor');
    if (editor) {
        const start = editor.selectionStart;
        const end = editor.selectionEnd;
        const value = editor.value;
        editor.value = value.substring(0, start) + markdown + value.substring(end);
        editor.focus();
        editor.setSelectionRange(start + markdown.length, start + markdown.length);
        updatePreview();
    } else {
        console.error("Element with ID 'markdownEditor' not found.");
    }
}

function validateMarkdown(content) {
    // Ensure content is non-empty and still valid markdown after code stripping
    return content && typeof content === 'string' && content.trim().length > 0;
}

function stripCodeFromMarkdown(content) {
    // Remove code blocks (```...```)
    content = content.replace(/```[\s\S]*?```/g, '');

    // Remove inline code (`...`)
    content = content.replace(/`[^`]*`/g, '');

    // Remove HTML tags if any (as a precaution)
    content = content.replace(/<[^>]*>/g, '');

    return content;
}
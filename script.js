document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const walkBtn = document.getElementById('walkBtn');
    const stageArea = document.getElementById('stageArea');
    const emptyState = document.getElementById('emptyState');
    const noteCard = document.getElementById('noteCard');
    const noteContent = document.getElementById('noteContent');
    const noteMeta = document.getElementById('noteMeta');
    const quickAddInput = document.getElementById('quickAddInput');
    const addNoteBtn = document.getElementById('addNoteBtn');
    const fileInput = document.getElementById('fileInput');
    const notesList = document.getElementById('notesList');
    const noteCount = document.getElementById('noteCount');

    // State
    let notes = [];
    let currentNoteIndex = -1;

    // Initialize
    loadNotes();
    updateUI();

    // Event Listeners
    addNoteBtn.addEventListener('click', addQuickNote);
    fileInput.addEventListener('change', handleFileUpload);
    walkBtn.addEventListener('click', randomWalk);
    
    // Allow Ctrl+Enter to submit quick note
    quickAddInput.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.key === 'Enter') {
            addQuickNote();
        }
    });

    // Core Functions

    function loadNotes() {
        const saved = localStorage.getItem('randomWalkNotes');
        if (saved) {
            try {
                notes = JSON.parse(saved);
            } catch (e) {
                console.error('Failed to parse notes', e);
                notes = [];
            }
        }
    }

    function saveNotes() {
        localStorage.setItem('randomWalkNotes', JSON.stringify(notes));
        updateUI();
    }

    function addQuickNote() {
        const text = quickAddInput.value.trim();
        if (!text) return;

        const newNote = {
            id: Date.now(),
            content: text,
            date: new Date().toISOString(),
            source: 'Manual Entry'
        };

        notes.unshift(newNote); // Add to top
        saveNotes();
        quickAddInput.value = '';
        
        // Visual feedback
        addNoteBtn.textContent = 'Added!';
        setTimeout(() => addNoteBtn.textContent = 'Add', 1000);
    }

    function handleFileUpload(e) {
        const files = e.target.files;
        if (!files.length) return;

        let processedCount = 0;

        Array.from(files).forEach(file => {
            const reader = new FileReader();
            reader.onload = (event) => {
                const text = event.target.result;
                if (text.trim()) {
                    notes.unshift({
                        id: Date.now() + Math.random(), // Ensure unique ID even for batch
                        content: text.trim(),
                        date: new Date().toISOString(),
                        source: file.name
                    });
                }
                processedCount++;
                if (processedCount === files.length) {
                    saveNotes();
                    fileInput.value = ''; // Reset input
                }
            };
            reader.readAsText(file);
        });
    }

    function deleteNote(id) {
        if(confirm('Forget this note?')) {
            notes = notes.filter(n => n.id !== id);
            saveNotes();
            // If we deleted the currently shown note, hide it
            if (currentNoteIndex !== -1 && notes.length === 0) {
                showEmptyState();
            }
        }
    }

    function randomWalk() {
        if (notes.length === 0) return;

        // Animation: Fade out current
        if (!noteCard.classList.contains('hidden')) {
            noteCard.style.opacity = '0';
            noteCard.style.transform = 'translateY(-10px)';
            
            setTimeout(() => {
                pickAndShowNote();
            }, 300);
        } else {
            pickAndShowNote();
        }
    }

    function pickAndShowNote() {
        // Simple random selection
        // Avoid picking the same note twice in a row if possible
        let nextIndex;
        if (notes.length === 1) {
            nextIndex = 0;
        } else {
            do {
                nextIndex = Math.floor(Math.random() * notes.length);
            } while (nextIndex === currentNoteIndex);
        }

        currentNoteIndex = nextIndex;
        const note = notes[currentNoteIndex];

        // Update Content
        noteContent.textContent = note.content;
        const dateStr = new Date(note.date).toLocaleDateString();
        noteMeta.textContent = `From: ${note.source || 'Unknown'} • ${dateStr}`;

        // Show Card
        emptyState.style.display = 'none';
        noteCard.classList.remove('hidden');
        noteCard.style.display = 'block';
        
        // Force reflow for animation
        void noteCard.offsetWidth; 
        
        noteCard.style.opacity = '1';
        noteCard.style.transform = 'translateY(0)';
    }

    function showEmptyState() {
        noteCard.classList.add('hidden');
        emptyState.style.display = 'block';
        currentNoteIndex = -1;
    }

    function updateUI() {
        // Update counts and button state
        noteCount.textContent = `${notes.length} note${notes.length !== 1 ? 's' : ''}`;
        walkBtn.disabled = notes.length === 0;

        // Update List
        notesList.innerHTML = '';
        notes.forEach(note => {
            const el = document.createElement('div');
            el.className = 'note-item';
            el.innerHTML = `
                <div class="note-preview">${note.content.substring(0, 50)}${note.content.length > 50 ? '...' : ''}</div>
                <button class="delete-btn" title="Delete">&times;</button>
            `;
            
            el.querySelector('.delete-btn').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteNote(note.id);
            });

            notesList.appendChild(el);
        });
    }
});

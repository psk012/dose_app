const fs = require('fs');

let code = fs.readFileSync('client/src/pages/safetynet.jsx', 'utf8');

const replaceStr = `async function saveContact() {
        const tempId = 'temp-' + Date.now();
        const optimisticContact = {
            id: tempId,
            name: form.name,
            email: form.email,
            isEmailVerified: true,
            isAccepted: false,
            isOptimistic: true
        };
        
        setConfig(prev => ({
             ...prev,
             trustedContacts: [...(prev?.trustedContacts || []), optimisticContact]
        }));
        
        const previousForm = { ...form };
        setForm(emptyForm);
        setShowAdd(false);

        setBusy("save-contact");
        setError("");
        startProgress();
        
        try {
            await addComfortZoneContact(token, {
                name: previousForm.name,
                email: previousForm.email,
                emailVerificationToken: previousForm.emailVerificationToken,
            });
            await loadData();
            flash("Contact verified. Invitation sent for acceptance.");
        } catch (err) {
            setConfig(prev => ({
                 ...prev,
                 trustedContacts: prev?.trustedContacts.filter(c => c.id !== tempId)
            }));
            setForm(previousForm);
            setShowAdd(true);
            setError("Couldn't save contact right now. We'll try again.");
        } finally {
            setBusy("");
            stopProgress();
        }
    }`;

// Match everything from async function saveContact() until the closing brace of that function
let newCode = code.replace(/async function saveContact\(\) \{[\s\S]*?flash\("Contact verified\. Invitation sent for acceptance\."\);\s*\}\);\s*\}/, replaceStr);

if (newCode !== code) {
    fs.writeFileSync('client/src/pages/safetynet.jsx', newCode);
    console.log("Successfully replaced in safetynet.jsx");
} else {
    console.error("Replacement target not found!");
}

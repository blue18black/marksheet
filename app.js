const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let currentSet = null;
let answered = {};
let editingAnswers = {};

loadSetList();

document.getElementById("createBtn").addEventListener("click", createEditor);
document.getElementById("loadBtn").addEventListener("click", loadSelected);
document.getElementById("closeBtn").addEventListener("click", closeSheet);
document.getElementById("deleteBtn").addEventListener("click", deleteSelected);
document.getElementById("exportBtn").addEventListener("click", exportSelected);
document.getElementById("importFile").addEventListener("change", importJson);
document.getElementById("scrollTopBtn").addEventListener("click", scrollToTop);
document.getElementById("reloadBtn").addEventListener("click", () => location.reload());
document.getElementById("resetBtn").addEventListener("click", resetAnswers);

function getSets(){
    return JSON.parse(localStorage.getItem("sets")) || [];
}

function saveSets(sets){
    localStorage.setItem("sets", JSON.stringify(sets));
}

function getSelectedSetId(){
    const value = document.getElementById("setList").value;
    return value === "" ? null : Number(value);
}

function resetStatusPanel(){
    document.getElementById("currentSetName").textContent = "なし";
    document.getElementById("totalCount").textContent = 0;
    document.getElementById("answeredCount").textContent = 0;
    document.getElementById("correctCount").textContent = 0;
    document.getElementById("wrongCount").textContent = 0;
    document.getElementById("unansweredCount").textContent = 0;
    document.getElementById("accuracy").textContent = "0%";
}

function closeSheet(){
    currentSet = null;
    answered = {};

    document.getElementById("quizArea").innerHTML = "";

    resetStatusPanel();
}

function createEditor(){
    const qCount = Number(document.getElementById("questionCount").value);
    const cCount = Number(document.getElementById("choiceCount").value);

    if(!qCount || qCount < 1){
        alert("問題数を1以上で入力してください");
        return;
    }

    if(!cCount || cCount < 2){
        alert("選択肢数を2以上で入力してください");
        return;
    }

    editingAnswers = {};

    let html = "";

    for(let i = 1; i <= qCount; i++){

        html += `
        <div class="edit-question">
            <div class="question-label">Q${i}</div>
            <div class="edit-choices">
        `;

        for(let j = 0; j < cCount; j++){
            html += `
            <span class="edit-choice" data-q="${i}" data-answer="${LETTERS[j]}">${LETTERS[j]}</span>
            `;
        }

        html += `
            </div>
        </div>
        `;
    }

    html += `<button id="saveSetBtn" class="btn btn-primary">保存</button>`;

    document.getElementById("answerEditor").innerHTML = html;

    document.querySelectorAll(".edit-choice").forEach(elem=>{
        elem.addEventListener("click", selectCorrectAnswer);
    });

    document.getElementById("saveSetBtn").addEventListener("click", saveSet);
}

function saveSet(){
    const name = document.getElementById("setName").value.trim();
    const qCount = Number(document.getElementById("questionCount").value);
    const cCount = Number(document.getElementById("choiceCount").value);

    if(!name){
        alert("セット名を入力してください");
        return;
    }

    for(let i = 1; i <= qCount; i++){
        if(!editingAnswers[i]){
            alert(`Q${i}の正解が未設定です`);
            return;
        }
    }

    const answers = [];

    for(let i = 1; i <= qCount; i++){
        answers.push(editingAnswers[i]);
    }

    const setData = {
        id: Date.now(),
        name,
        questionCount: qCount,
        choiceCount: cCount,
        answers
    };

    const allSets = getSets();
    allSets.push(setData);
    saveSets(allSets);

    loadSetList();
    alert("保存しました");
    goHome();
}

function loadSetList(){
    const list = document.getElementById("setList");
    list.innerHTML = "";

    getSets().forEach(set=>{
        const option = document.createElement("option");
        option.value = set.id;
        option.textContent = set.name;
        list.appendChild(option);
    });
}

function loadSelected(){
    const id = getSelectedSetId();
    const set = id != null ? getSets().find(x => x.id === id) : null;

    if(!set){
        alert("セットを選択してください");
        return;
    }

    currentSet = set;
    answered = {};

    document.getElementById("currentSetName").textContent = currentSet.name;

    renderQuiz();
    updateResults();
}

function renderQuiz(){
    answered = {};

    let html = "";

    currentSet.answers.forEach((answer, index) => {

        html += `
        <div class="question">
            <div class="question-label">Q${index + 1}</div>
            <div class="choices">
        `;

        for(let i = 0; i < currentSet.choiceCount; i++){
            const letter = LETTERS[i];
            html += `
            <span class="choice" data-q="${index}" data-answer="${letter}">${letter}</span>
            `;
        }

        html += `
            </div>
            <div class="result" id="result${index}">-</div>
        </div>
        `;
    });

    document.getElementById("quizArea").innerHTML = html;

    document.querySelectorAll(".choice").forEach(elem=>{
        elem.addEventListener("click", checkAnswer);
    });
}

function checkAnswer(){
    const q = Number(this.dataset.q);
    const answer = this.dataset.answer;

    document.querySelectorAll(`.choice[data-q="${q}"]`).forEach(x=>{
        x.classList.remove("choice-correct", "choice-wrong");
    });

    if(answered[q] === answer){
        delete answered[q];
    }else{
        answered[q] = answer;

        this.classList.add(
            answer === currentSet.answers[q] ? "choice-correct" : "choice-wrong"
        );
    }

    updateResults();
}

function deleteSelected(){
    const id = getSelectedSetId();
    const sets = getSets();
    const target = id != null ? sets.find(x => x.id === id) : null;

    if(!target){
        alert("セットを選択してください");
        return;
    }

    if(!confirm(`「${target.name}」を削除しますか？`)){
        return;
    }

    saveSets(sets.filter(x => x.id !== id));
    loadSetList();

    if(currentSet && currentSet.id === id){
        closeSheet();
    }
}

function exportSelected(){
    const id = getSelectedSetId();
    const target = id != null ? getSets().find(x => x.id === id) : null;

    if(!target){
        alert("セットを選択してください");
        return;
    }

    const blob = new Blob(
        [JSON.stringify(target, null, 2)],
        {type: "application/json"}
    );

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = `${target.name}.json`;
    a.click();

    setTimeout(() => URL.revokeObjectURL(url), 0);
}

function importJson(event){
    const file = event.target.files[0];
    if(!file) return;

    const reader = new FileReader();

    reader.onload = e => {
        let imported;

        try{
            imported = JSON.parse(e.target.result);
        }catch(err){
            alert("JSONの読み込みに失敗しました");
            event.target.value = "";
            return;
        }

        const isValid =
            imported &&
            Array.isArray(imported.answers) &&
            Number(imported.questionCount) > 0 &&
            Number(imported.choiceCount) > 1 &&
            imported.answers.length === Number(imported.questionCount);

        if(!isValid){
            alert("セットの形式が正しくありません");
            event.target.value = "";
            return;
        }

        imported.id = Date.now();

        const sets = getSets();
        sets.push(imported);
        saveSets(sets);

        loadSetList();
        event.target.value = "";
        alert("読み込みました");
    };

    reader.onerror = () => {
        alert("ファイルの読み込みに失敗しました");
        event.target.value = "";
    };

    reader.readAsText(file);
}

function updateResults(){
    let correct = 0;

    for(let i = 0; i < currentSet.answers.length; i++){
        const result = document.getElementById(`result${i}`);

        if(answered[i] == null){
            result.className = "result";
            result.textContent = "-";
            continue;
        }

        const isCorrect = answered[i] === currentSet.answers[i];
        if(isCorrect) correct++;

        result.className = `result ${isCorrect ? "correct" : "wrong"}`;
        result.textContent = `${isCorrect ? "○" : "×"} ${currentSet.answers[i]}`;
    }

    const total = currentSet.questionCount;
    const answeredCount = Object.keys(answered).length;
    const wrong = answeredCount - correct;
    const unanswered = total - answeredCount;
    const rate = answeredCount > 0 ? (correct / answeredCount * 100) : 0;

    document.getElementById("totalCount").textContent = total;
    document.getElementById("answeredCount").textContent = answeredCount;
    document.getElementById("correctCount").textContent = correct;
    document.getElementById("wrongCount").textContent = wrong;
    document.getElementById("unansweredCount").textContent = unanswered;
    document.getElementById("accuracy").textContent = rate.toFixed(1) + "%";
}

function goHome(){
    closeSheet();

    editingAnswers = {};

    document.getElementById("answerEditor").innerHTML = "";
    document.getElementById("setName").value = "";
    document.getElementById("questionCount").value = "";
    document.getElementById("choiceCount").value = "";

    window.scrollTo({top: 0, behavior: "smooth"});
}

function scrollToTop(){
    window.scrollTo({top: 0, behavior: "smooth"});
}

function resetAnswers(){
    answered = {};

    document.querySelectorAll(".choice").forEach(elem=>{
        elem.classList.remove("choice-correct", "choice-wrong");
    });

    updateResults();
}

function selectCorrectAnswer(){
    const q = Number(this.dataset.q);
    const answer = this.dataset.answer;

    document.querySelectorAll(`.edit-choice[data-q="${q}"]`).forEach(x=>{
        x.classList.remove("edit-selected");
    });

    this.classList.add("edit-selected");

    editingAnswers[q] = answer;
}

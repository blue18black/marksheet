const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

let currentSet = null;

let correctCount = 0;

let answered = {};


loadSetList();

document
.getElementById("createBtn")
.addEventListener("click", createEditor);

document
.getElementById("loadBtn")
.addEventListener("click", loadSelected);

document
.getElementById("deleteBtn")
.addEventListener("click", deleteSelected);

document
.getElementById("exportBtn")
.addEventListener("click", exportSelected);

document
.getElementById("importFile")
.addEventListener("change", importJson);

function createEditor(){

    const qCount =
    Number(document.getElementById("questionCount").value);

    const cCount =
    Number(document.getElementById("choiceCount").value);

    let html="";

    for(let i=1;i<=qCount;i++){

        html += `<div>
        Q${i}
        <select id="ans${i}">
        `;

        for(let j=0;j<cCount;j++){

            html += `
            <option>
            ${LETTERS[j]}
            </option>
            `;

        }

        html += `
        </select>
        </div>
        `;
    }

    html += `
    <button onclick="saveSet()">
    保存
    </button>
    `;

    document
    .getElementById("answerEditor")
    .innerHTML = html;
}

function saveSet(){

    const name =
    document.getElementById("setName").value;

    const qCount =
    Number(document.getElementById("questionCount").value);

    const cCount =
    Number(document.getElementById("choiceCount").value);

    const answers=[];

    for(let i=1;i<=qCount;i++){

        answers.push(
            document.getElementById(`ans${i}`).value
        );
    }

    const setData = {
        id:Date.now(),
        name,
        questionCount:qCount,
        choiceCount:cCount,
        answers
    };

    const allSets =
    JSON.parse(localStorage.getItem("sets")) || [];

    allSets.push(setData);

    localStorage.setItem(
        "sets",
        JSON.stringify(allSets)
    );

    loadSetList();

    alert("保存しました");
    goHome();
}

function loadSetList(){

    const list =
    document.getElementById("setList");

    list.innerHTML="";

    const sets =
    JSON.parse(localStorage.getItem("sets")) || [];

    sets.forEach(set=>{

        const option =
        document.createElement("option");

        option.value=set.id;
        option.textContent=set.name;

        list.appendChild(option);

    });
}

function loadSelected(){

    const id =
    Number(document.getElementById("setList").value);

    const sets =
    JSON.parse(localStorage.getItem("sets")) || [];

    currentSet =
    sets.find(x=>x.id===id);

    renderQuiz();
}

function renderQuiz(){

    let html="";

    currentSet.answers.forEach((answer,index)=>{

        html += `
        <div class="question">

            <div class="question-label">
                Q${index+1}
            </div>

            <div class="choices">
        `;

        for(
            let i=0;
            i<currentSet.choiceCount;
            i++
        ){

            const letter =
            LETTERS[i];

            html += `
            <span
             class="choice"
             data-q="${index}"
             data-answer="${letter}">
             ${letter}
            </span>
            `;
        }

        html += `
            </div>

            <div
                class="result"
                id="result${index}">
                -
            </div>

        </div>
        `;
    });

    document
    .getElementById("quizArea")
    .innerHTML = html;

    document
    .querySelectorAll(".choice")
    .forEach(elem=>{

        elem.addEventListener(
        "click",
        checkAnswer);

    });
}

function checkAnswer(){

    const q =
        Number(this.dataset.q);

    const answer =
        this.dataset.answer;

    document
    .querySelectorAll(
        `[data-q="${q}"]`
    )
    .forEach(x=>{

        x.classList.remove(
            "choice-correct",
            "choice-wrong"
        );
    });

    answered[q]=answer;

    if(answer===currentSet.answers[q]){

        this.classList.add(
            "choice-correct"
        );

    }else{

        this.classList.add(
            "choice-wrong"
        );

    }

    updateResults();
}

function deleteSelected(){

    const id =
    Number(document.getElementById("setList").value);

    let sets =
    JSON.parse(localStorage.getItem("sets")) || [];

    sets =
    sets.filter(x=>x.id!==id);

    localStorage.setItem(
        "sets",
        JSON.stringify(sets)
    );

    loadSetList();
}

function exportSelected(){

    const id =
    Number(document.getElementById("setList").value);

    const sets =
    JSON.parse(localStorage.getItem("sets")) || [];

    const target =
    sets.find(x=>x.id===id);

    const blob =
    new Blob(
        [JSON.stringify(target,null,2)],
        {type:"application/json"}
    );

    const a =
    document.createElement("a");

    a.href =
    URL.createObjectURL(blob);

    a.download =
    `${target.name}.json`;

    a.click();
}

function importJson(event){

    const file =
    event.target.files[0];

    if(!file)return;

    const reader =
    new FileReader();

    reader.onload = e=>{

        const imported =
        JSON.parse(e.target.result);

        const sets =
        JSON.parse(
        localStorage.getItem("sets")
        ) || [];

        sets.push(imported);

        localStorage.setItem(
        "sets",
        JSON.stringify(sets)
        );

        loadSetList();
    };

    reader.readAsText(file);
}

function updateResults(){

    let correct = 0;

    for(let i=0;i<currentSet.answers.length;i++){

        const result =
        document.getElementById(`result${i}`);

        if(answered[i]==null){

            result.textContent="-";
            continue;
        }

        if(answered[i]===currentSet.answers[i]){

            correct++;

            result.className=
            "result correct";

            result.textContent=`○ ${currentSet.answers[i]}`;

        }else{

            result.className=
            "result wrong";

            result.textContent=
            `× ${currentSet.answers[i]}`;

        }
    }

    const total = currentSet.questionCount;

    const answeredCount =
        Object.keys(answered).length;

    const wrong =
        answeredCount - correct;

    const unanswered =
        total - answeredCount;

    let rate = 0;

    if(answeredCount > 0){
        rate =
            correct /
            (correct + wrong) *
            100;
    }

    document.getElementById(
    "totalCount"
    ).textContent = total;

    document.getElementById(
        "answeredCount"
    ).textContent = answeredCount;

    document.getElementById(
        "correctCount"
    ).textContent = correct;

    document.getElementById(
        "wrongCount"
    ).textContent = wrong;

    document.getElementById(
        "unansweredCount"
    ).textContent = unanswered;

    document.getElementById(
        "accuracy"
    ).textContent =
        rate.toFixed(1) + "%";
}

// function goHome(){

//     document.getElementById("setName").value = "";

//     document.getElementById("questionCount").value = "";

//     document.getElementById("choiceCount").value = "";

//     document.getElementById("answerEditor").innerHTML = "";

//     document.getElementById("quizArea").innerHTML = "";

//     currentSet = null;

//     answered = {};

//     updateStatusPanel(0,0,0,0);
// }
function goHome(){

    currentSet = null;

    answered = {};

    document
        .getElementById("quizArea")
        .innerHTML = "";

    document
        .getElementById("answerEditor")
        .innerHTML = "";

    document
        .getElementById("setName")
        .value = "";

    document
        .getElementById("questionCount")
        .value = "";

    document
        .getElementById("choiceCount")
        .value = "";

    updateStatusPanel(
        0,
        0,
        0,
        0
    );

    window.scrollTo({
        top:0,
        behavior:"smooth"
    });
}
function updateStatusPanel(total, correct, wrong, rate){

    document.getElementById("totalCount").textContent = total;

    document.getElementById("correctCount").textContent = correct;

    document.getElementById("wrongCount").textContent = wrong;

    document.getElementById("accuracy").textContent =
        rate + "%";
}

function scrollToTop() {
  window.scrollTo({
    top: 0,
    behavior: "smooth" // スムーズにスクロールさせる
  });
}

function resetAnswers(){

    answered = {};

    document
        .querySelectorAll(".choice")
        .forEach(elem=>{

            elem.classList.remove(
                "choice-correct","choice-wrong"
            );
        });

    document
        .querySelectorAll(".result")
        .forEach(elem=>{

            elem.textContent = "-";

            elem.className = "result";
        });

    updateResults();
}
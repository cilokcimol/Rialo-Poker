const SUITS = ['♥', '♦', '♣', '♠'];
const RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];
const BOT_NAMES = ["Cipher", "Atlas", "Magnus", "Orion", "Lyra", "Silas", "Nova", "Validator", "Satoshi", "Gwei"];

let gameState = {
    player: { name: 'Player', balance: 100, hand: [] },
    bot: { name: 'Bot', balance: 100, hand: [] },
    pot: 0,
    deck: [],
    communityCards: [],
    stage: 0,
    currency: 'ETH'
};

const screens = { login: document.getElementById('login-screen'), game: document.getElementById('game-screen') };
const ui = {
    botName: document.getElementById('bot-name'),
    botBal: document.getElementById('bot-balance'),
    userName: document.getElementById('user-name'),
    userBal: document.getElementById('user-balance'),
    pot: document.getElementById('pot-amount'),
    msg: document.getElementById('game-message'),
    commCards: document.getElementById('community-cards'),
    userCards: document.getElementById('user-cards'),
    botCards: document.getElementById('bot-cards'),
    currencyLabels: document.querySelectorAll('.curr-label'),
    statusBot: document.getElementById('bot-status'),
    statusUser: document.getElementById('user-status')
};
const btns = {
    start: document.getElementById('start-btn'),
    fold: document.getElementById('fold-btn'),
    check: document.getElementById('check-btn'),
    call: document.getElementById('call-btn'),
    raise: document.getElementById('raise-btn'),
    assetOpts: document.querySelectorAll('.asset-btn')
};

btns.assetOpts.forEach(btn => {
    btn.addEventListener('click', () => {
        btns.assetOpts.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        gameState.currency = btn.dataset.currency;
    });
});

btns.start.addEventListener('click', () => {
    const nameInput = document.getElementById('username-input').value;
    if (!nameInput) return alert("Identity Required.");
    
    gameState.player.name = nameInput;
    
    gameState.bot.name = BOT_NAMES[Math.floor(Math.random() * BOT_NAMES.length)];
    
    ui.userName.innerText = gameState.player.name;
    ui.botName.innerText = gameState.bot.name;
    ui.currencyLabels.forEach(el => el.innerText = gameState.currency);

    screens.login.classList.remove('active');
    screens.game.classList.add('active');
    
    startNewHand();
});

function createDeck() {
    let deck = [];
    for (let s of SUITS) {
        for (let r of RANKS) {
            deck.push({ suit: s, rank: r, color: (s === '♥' || s === '♦') ? 'red' : 'black' });
        }
    }
    return deck.sort(() => Math.random() - 0.5);
}

function startNewHand() {

    gameState.deck = createDeck();
    gameState.player.hand = [gameState.deck.pop(), gameState.deck.pop()];
    gameState.bot.hand = [gameState.deck.pop(), gameState.deck.pop()];
    gameState.communityCards = [];
    gameState.pot = 0;
    gameState.stage = 0;

    const blind = 1;
    gameState.player.balance -= blind;
    gameState.bot.balance -= blind;
    gameState.pot += (blind * 2);

    updateUI();
    renderCards(false);
    ui.msg.innerText = "PRE-FLOP: AWAITING ACTION";
    enableControls(true);
}

function nextStage() {
    gameState.stage++;
    ui.statusUser.classList.add('hidden');
    ui.statusBot.classList.add('hidden');

    if (gameState.stage === 1) {

        gameState.communityCards.push(gameState.deck.pop(), gameState.deck.pop(), gameState.deck.pop());
        ui.msg.innerText = "BLOCK MINED: FLOP";
    } else if (gameState.stage === 2) {

        gameState.communityCards.push(gameState.deck.pop());
        ui.msg.innerText = "BLOCK MINED: TURN";
    } else if (gameState.stage === 3) {

        gameState.communityCards.push(gameState.deck.pop());
        ui.msg.innerText = "BLOCK MINED: RIVER";
    } else {
        determineWinner();
        return;
    }
    
    renderCards(false);
    

    setTimeout(() => {
        if(gameState.stage <= 3) {
           botAction(); 
        }
    }, 1000);
}


btns.fold.addEventListener('click', () => {
    ui.msg.innerText = "DISCONNECTED. BOT WINS.";
    endHand(false);
});

btns.check.addEventListener('click', () => {
    ui.statusUser.innerText = "VALIDATED";
    ui.statusUser.classList.remove('hidden');
    nextStage();
});

btns.call.addEventListener('click', () => {
    const bet = 5;
    gameState.player.balance -= bet;
    gameState.pot += bet;
    ui.statusUser.innerText = "MATCHED";
    ui.statusUser.classList.remove('hidden');
    updateUI();
    nextStage();
});

btns.raise.addEventListener('click', () => {
    const bet = 10;
    gameState.player.balance -= bet;
    gameState.pot += bet;
    ui.statusUser.innerText = "INJECTED +10";
    ui.statusUser.classList.remove('hidden');
    updateUI();

    setTimeout(() => {
        gameState.bot.balance -= bet;
        gameState.pot += bet;
        ui.statusBot.innerText = "ACCEPTED";
        ui.statusBot.classList.remove('hidden');
        updateUI();
        nextStage();
    }, 800);
});

function botAction() {

    ui.statusBot.innerText = "VALIDATING...";
    ui.statusBot.classList.remove('hidden');
}


function determineWinner() {
    renderCards(true);
    enableControls(false);
    

    
    ui.msg.innerText = "CONSENSUS REACHED: SHOWDOWN";
    
    setTimeout(() => {
        const playerWin = Math.random() > 0.5;
        
        if (playerWin) {
            ui.msg.innerText = `TRANSACTION CONFIRMED: ${gameState.player.name} WINS!`;
            gameState.player.balance += gameState.pot;
        } else {
            ui.msg.innerText = `TRANSACTION FAILED: ${gameState.bot.name} WINS!`;
            gameState.bot.balance += gameState.pot;
        }
        
        updateUI();
        
        setTimeout(() => {
            startNewHand();
        }, 3000);
    }, 1000);
}

function endHand(playerWon) {
    if (playerWon) gameState.player.balance += gameState.pot;
    else gameState.bot.balance += gameState.pot;
    updateUI();
    setTimeout(startNewHand, 2000);
}


function renderCards(showBot) {

    ui.userCards.innerHTML = '';
    ui.botCards.innerHTML = '';
    ui.commCards.innerHTML = '';


    gameState.player.hand.forEach(c => ui.userCards.appendChild(createCardEl(c)));


    gameState.bot.hand.forEach(c => {
        if (showBot) ui.botCards.appendChild(createCardEl(c));
        else ui.botCards.appendChild(createCardBack());
    });

    gameState.communityCards.forEach(c => ui.commCards.appendChild(createCardEl(c)));
}

function createCardEl(card) {
    const el = document.createElement('div');
    el.className = `card ${card.color}`;
    el.innerText = `${card.rank}${card.suit}`;
    return el;
}

function createCardBack() {
    const el = document.createElement('div');
    el.className = 'card card-back';
    return el;
}

function updateUI() {
    ui.userBal.innerText = gameState.player.balance.toFixed(2);
    ui.botBal.innerText = gameState.bot.balance.toFixed(2);
    ui.pot.innerText = gameState.pot.toFixed(2);
}

function enableControls(state) {
    btns.fold.disabled = !state;
    btns.check.disabled = !state;
    btns.call.disabled = !state;
    btns.raise.disabled = !state;
}

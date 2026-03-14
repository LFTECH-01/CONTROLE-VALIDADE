import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, onAuthStateChanged, signOut, updateProfile } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, query, where, onSnapshot, deleteDoc, doc, getDocs, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Configurações do seu Firebase (Extraídas do seu index.html)
const firebaseConfig = {
    apiKey: "AIzaSyBH4hDVSqv7enMugPWUaM9CksO4F1yKvuQ",
    authDomain: "controle-de-validade-3e66a.firebaseapp.com",
    projectId: "controle-de-validade-3e66a",
    storageBucket: "controle-de-validade-3e66a.firebasestorage.app",
    messagingSenderId: "163605465156",
    appId: "1:163605465156:web:8f7728cbf73e6bf6265411"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let html5QrCode;
let listaAtualParaExportar = [];

// --- UTILITÁRIOS ---
const formatarDataBR = (dataStr) => {
    if(!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
};

// --- BANCO DE DADOS (PRODUTOS BASE) ---
async function buscarProdutoNoFirebase(ean) {
    const q = query(collection(db, "produtos_base"), where("__name__", "==", ean));
    const snap = await getDocs(q);
    if (!snap.empty) {
        document.getElementById('descricao').value = snap.docs[0].data().nome;
        document.getElementById('validade').focus();
    }
}

document.getElementById('codigo').oninput = (e) => {
    if(e.target.value.length >= 8) buscarProdutoNoFirebase(e.target.value);
};

// --- SCANNER ---
document.getElementById('btnScan').onclick = () => {
    document.getElementById('reader').style.display = 'block';
    html5QrCode = new Html5Qrcode("reader");
    
    html5QrCode.start({ facingMode: "environment" }, { fps: 15, qrbox: { width: 250, height: 120 } }, (text) => {
        document.getElementById('codigo').value = text;
        buscarProdutoNoFirebase(text);
        pararLeitor();
    }).catch(err => console.error(err));
};

const pararLeitor = () => {
    if (html5QrCode) {
        html5QrCode.stop().finally(() => {
            document.getElementById('reader').style.display = 'none';
        });
    }
};

// --- EXPORTAÇÃO COM CONFIRMAÇÃO ---
document.getElementById('btnExportar').onclick = () => {
    if (listaAtualParaExportar.length === 0) return Swal.fire('Vazio', 'Nada para exportar!', 'info');
    
    Swal.fire({
        title: 'Exportar para Excel?',
        text: `Deseja gerar o arquivo com ${listaAtualParaExportar.length} itens?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1d6f42',
        confirmButtonText: 'Sim, exportar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const ws = XLSX.utils.json_to_sheet(listaAtualParaExportar.map(item => ({
                "Código": item.codigo, 
                "Descrição": item.descricao, 
                "Validade": formatarDataBR(item.validade), 
                "Quantidade": item.quantidade
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Coleta");
            XLSX.writeFile(wb, `Coleta_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
            Swal.fire('Sucesso!', 'Arquivo gerado.', 'success');
        }
    });
};

// --- LIMPAR TUDO COM CONFIRMAÇÃO ---
document.getElementById('btnLimparTudo').onclick = async () => {
    Swal.fire({
        title: 'Limpar tudo?',
        text: "Esta ação apagará toda a sua lista!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sim, apagar tudo'
    }).then(async (result) => {
        if (result.isConfirmed) {
            const snap = await getDocs(query(collection(db, "estoque"), where("uid", "==", auth.currentUser.uid)));
            const batch = writeBatch(db);
            snap.forEach(d => batch.delete(doc(db, "estoque", d.id)));
            await batch.commit();
            Swal.fire('Limpo!', 'Sua lista foi esvaziada.', 'success');
        }
    });
};

// --- EXCLUIR ITEM ÚNICO COM CONFIRMAÇÃO ---
window.excluirItem = (id) => {
    Swal.fire({
        title: 'Excluir item?',
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDoc(doc(db, "estoque", id));
        }
    });
};

// --- AUTENTICAÇÃO ---
document.getElementById('btn-login').onclick = () => {
    signInWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('senha').value)
        .catch(() => Swal.fire('Erro', "E-mail ou senha incorretos.", 'error'));
};

document.getElementById('btn-cadastrar').onclick = () => {
    const nome = document.getElementById('nome_usuario').value;
    createUserWithEmailAndPassword(auth, document.getElementById('email').value, document.getElementById('senha').value)
        .then(res => updateProfile(res.user, { displayName: nome }))
        .then(() => location.reload());
};

document.getElementById('btn-logout').onclick = () => signOut(auth);

document.getElementById('btn-toggle-reg').onclick = () => {
    document.getElementById('register-fields').classList.toggle('hidden');
    document.getElementById('btn-cadastrar').classList.toggle('hidden');
    document.getElementById('btn-login').classList.toggle('hidden');
};

onAuthStateChanged(auth, (user) => {
    if (user) {
        document.getElementById('auth-section').classList.add('hidden');

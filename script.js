import { auth, db } from './firebase-config.js';
import { 
    signInWithEmailAndPassword, 
    createUserWithEmailAndPassword, 
    onAuthStateChanged, 
    signOut, 
    updateProfile 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { 
    collection, addDoc, query, where, onSnapshot, 
    deleteDoc, doc, getDocs, writeBatch 
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let html5QrCode;
let listaAtualParaExportar = [];

// --- UTILITÁRIOS ---
const formatarDataBR = (dataStr) => {
    if(!dataStr) return "";
    const [ano, mes, dia] = dataStr.split("-");
    return `${dia}/${mes}/${ano}`;
};

// --- BANCO DE DADOS (BASE DE PRODUTOS) ---
async function atualizarStatusContagemCloud() {
    const snapshot = await getDocs(collection(db, "produtos_base"));
    const statusEl = document.getElementById('statusCloud');
    if(statusEl) statusEl.innerText = `${snapshot.size} PRODUTOS NA NUVEM`;
}

async function buscarProdutoNoFirebase(ean) {
    const q = query(collection(db, "produtos_base"), where("__name__", "==", ean));
    const snap = await getDocs(q);
    if (!snap.empty) {
        document.getElementById('descricao').value = snap.docs[0].data().nome;
        document.getElementById('validade').focus();
    }
}

// --- EVENTOS DE INTERFACE ---
document.getElementById('codigo').oninput = (e) => {
    if(e.target.value.length >= 8) buscarProdutoNoFirebase(e.target.value);
};

document.getElementById('csvFile').onchange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Swal.fire({ title: 'Sincronizando...', text: 'Aguarde', allowOutsideClick: false, didOpen: () => Swal.showLoading() });

    const reader = new FileReader();
    reader.onload = async (event) => {
        const lines = event.target.result.split(/\r?\n/);
        const batch = writeBatch(db);
        let cont = 0;
        lines.forEach(line => {
            const cols = line.split(/[;,]/);
            if (cols.length >= 2) {
                const ean = cols[0].trim().replace(/"/g, '');
                const nome = cols[1].trim().replace(/"/g, '');
                if (ean && ean.toLowerCase() !== "ean") {
                    batch.set(doc(db, "produtos_base", ean), { nome: nome });
                    cont++;
                }
            }
        });
        await batch.commit();
        await atualizarStatusContagemCloud();
        Swal.fire('Sucesso', `${cont} produtos sincronizados!`, 'success');
    };
    reader.readAsText(file, 'UTF-8');
};

// --- SCANNER ---
document.getElementById('btnScan').onclick = () => {
    document.getElementById('reader').style.display = 'block';
    document.getElementById('btnScan').style.display = 'none';
    document.getElementById('btnStopCam').style.display = 'block';
    
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
            document.getElementById('btnScan').style.display = 'block';
            document.getElementById('btnStopCam').style.display = 'none';
        });
    }
};
document.getElementById('btnStopCam').onclick = pararLeitor;

// --- EXPORTAÇÃO E LIMPEZA ---
document.getElementById('btnExportar').onclick = () => {
    if (listaAtualParaExportar.length === 0) return Swal.fire('Vazio', 'Nada para exportar!', 'info');
    
    // NOVA CONFIRMAÇÃO PARA EXPORTAR
    Swal.fire({
        title: 'Exportar para Excel?',
        text: `Deseja gerar o arquivo com ${listaAtualParaExportar.length} itens coletados?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#1d6f42',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Sim, exportar!',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            const ws = XLSX.utils.json_to_sheet(listaAtualParaExportar.map(item => ({
                "Código": item.codigo, "Descrição": item.descricao, "Validade": formatarDataBR(item.validade), "Quantidade": item.quantidade
            })));
            const wb = XLSX.utils.book_new();
            XLSX.utils.book_append_sheet(wb, ws, "Coleta");
            XLSX.writeFile(wb, `Coleta_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
            
            Swal.fire('Exportado!', 'Sua planilha foi gerada com sucesso.', 'success');
        }
    });
};

document.getElementById('btnLimparTudo').onclick = async () => {
    const result = await Swal.fire({ 
        title: 'Limpar tudo?', 
        text: "Isso apagará permanentemente toda a sua lista atual!",
        icon: 'warning', 
        showCancelButton: true, 
        confirmButtonColor: '#dc3545',
        confirmButtonText: 'Sim, limpar tudo' 
    });
    
    if (result.isConfirmed) {
        const snap = await getDocs(query(collection(db, "estoque"), where("uid", "==", auth.currentUser.uid)));
        const batch = writeBatch(db);
        snap.forEach(d => batch.delete(doc(db, "estoque", d.id)));
        await batch.commit();
        Swal.fire('Limpo!', 'Sua lista foi esvaziada.', 'success');
    }
};

// Função global para o botão de excluir da lista (X)
window.excluirItem = (id) => {
    // NOVA CONFIRMAÇÃO PARA EXCLUIR ITEM ÚNICO
    Swal.fire({
        title: 'Excluir item?',
        text: "Deseja remover este produto da sua coleta?",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6e7881',
        confirmButtonText: 'Sim, excluir',
        cancelButtonText: 'Manter'
    }).then((result) => {
        if (result.isConfirmed) {
            deleteDoc(doc(db, "estoque", id));
            // Notificação discreta de sucesso
            Swal.fire({
                toast: true,
                position: 'top-end',
                icon: 'success',
                title: 'Item removido',
                showConfirmButton: false,
                timer: 1500
            });
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
        document.getElementById('app-section').classList.remove('hidden');
        document.getElementById('display-user-name').innerText = user.displayName || user.email;
        carregarEstoque(user.uid);
        atualizarStatusContagemCloud();
    } else {
        document.getElementById('auth-section').classList.remove('hidden');
        document.getElementById('app-section').classList.add('hidden');
    }
});

// --- SALVAR NO ESTOQUE ---
document.getElementById('formEstoque').onsubmit = async (e) => {
    e.preventDefault();
    await addDoc(collection(db, "estoque"), {
        uid: auth.currentUser.uid,
        codigo: document.getElementById('codigo').value,
        descricao: document.getElementById('descricao').value,
        validade: document.getElementById('validade').value,
        quantidade: document.getElementById('quantidade').value,
        criadoEm: Date.now()
    });
    e.target.reset();
    document.getElementById('codigo').focus();
};

function carregarEstoque(uid) {
    onSnapshot(query(collection(db, "estoque"), where("uid", "==", uid)), (snap) => {
        const lista = document.getElementById('listaProdutos');
        document.getElementById('countItens').innerText = snap.size;
        lista.innerHTML = '';
        listaAtualParaExportar = [];
        snap.forEach(d => {
            const p = d.data();
            listaAtualParaExportar.push(p);
            const div = document.createElement('div');
            div.className = 'item';
            div.innerHTML = `<div><strong>${p.descricao}</strong><br><small>${p.codigo} | Qtd: ${p.quantidade} | Val: ${formatarDataBR(p.validade)}</small></div>
                             <button onclick=\"excluirItem('${d.id}')\" style=\"width:auto; background:none; border:none; color:red; cursor:pointer\">✕</button>`;
            lista.appendChild(div);
        });
    });
}

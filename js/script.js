document.addEventListener('DOMContentLoaded', function() {
    // Carregar fontes do Google
    const link = document.createElement('link');
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Montserrat:wght@400;600&display=swap';
    link.rel = 'stylesheet';
    document.head.appendChild(link);
    
    // Efeito de scroll no header
    const header = document.querySelector('header');
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            header.classList.add('scrolled');
        } else {
            header.classList.remove('scrolled');
        }
    });

    // Smooth scrolling para links do menu
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            e.preventDefault();
            
            const targetId = this.getAttribute('href');
            const targetElement = document.querySelector(targetId);
            
            if (targetElement) {
                window.scrollTo({
                    top: targetElement.offsetTop - 70,
                    behavior: 'smooth'
                });
            }
        });
    });

    // Tabs do cardápio
    const tabBtns = document.querySelectorAll('.tab-btn');
    const tabContents = document.querySelectorAll('.tab-content');
    
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            const tabId = this.getAttribute('data-tab');
            
            // Remove active class de todos os botões e conteúdos
            tabBtns.forEach(btn => btn.classList.remove('active'));
            tabContents.forEach(content => content.classList.remove('active'));
            
            // Adiciona active class ao botão e conteúdo clicado
            this.classList.add('active');
            document.getElementById(tabId).classList.add('active');
        });
    });

    // Carregar produtos
    fetch('produtos.json')
        .then(response => response.json())
        .then(data => {
            loadProdutos(data.produtos);
            loadCardapio(data.cardapio);
            setupPedidos(data.pedidos); // Substitui loadPedidos por setupPedidos
        })
        .catch(error => console.error('Erro ao carregar produtos:', error));

    // Formulário de orçamento
    const orcamentoForm = document.getElementById('orcamento-form');
    if (orcamentoForm) {
        orcamentoForm.addEventListener('submit', function(e) {
            e.preventDefault();
            
            const formData = new FormData(this);
            const data = Object.fromEntries(formData);
            
            console.log('Dados do orçamento:', data);
            alert('Orçamento enviado com sucesso! Entraremos em contato em breve.');
            this.reset();
        });
    }

    // Funções para carregar dados
    function loadProdutos(produtos) {
        const container = document.getElementById('produtos-container');
        if (!container) return;
        
        container.innerHTML = produtos.map(produto => `
            <div class="produto-card">
                <div class="produto-img">
                    <img src="images/${produto.imagem}" alt="${produto.nome}">
                </div>
                <div class="produto-info">
                    <h3>${produto.nome}</h3>
                    <p>${produto.descricao}</p>
                    <div class="produto-preco">R$ ${produto.preco.toFixed(2)}</div>
                </div>
            </div>
        `).join('');
    }

    function loadCardapio(cardapio) {
        Object.keys(cardapio).forEach(categoria => {
            const container = document.getElementById(categoria);
            if (!container) return;
            
            container.innerHTML = cardapio[categoria].map(item => `
                <div class="cardapio-item">
                    <h3>${item.nome}</h3>
                    <div class="preco">R$ ${item.preco.toFixed(2)}</div>
                </div>
            `).join('');
        });
    }

    // Nova função para gerenciar pedidos (substitui a loadPedidos)
    function setupPedidos(pedidos) {
        const pedidoContainer = document.getElementById('pedido-container');
        const finalizarPedidoBtn = document.getElementById('finalizar-pedido');
        let pedidoItens = [];
        
        if (!pedidoContainer) return;

        // Carrega os itens para pedido
        pedidoContainer.innerHTML = pedidos.map(item => `
            <div class="pedido-item" data-id="${item.id || Math.random().toString(36).substr(2, 9)}">
                <div class="pedido-item-img">
                    <img src="images/${item.imagem}" alt="${item.nome}">
                </div>
                <h3>${item.nome}</h3>
                <div class="preco">R$ ${item.preco.toFixed(2)}</div>
                <div class="quantidade-control">
                    <button class="diminuir">-</button>
                    <span class="quantidade">0</span>
                    <button class="aumentar">+</button>
                </div>
            </div>
        `).join('');
        
        // Adiciona eventos aos botões de quantidade
        document.querySelectorAll('.quantidade-control button').forEach(btn => {
            btn.addEventListener('click', function() {
                const itemElement = this.closest('.pedido-item');
                const id = itemElement.getAttribute('data-id');
                const quantidadeElement = itemElement.querySelector('.quantidade');
                let quantidade = parseInt(quantidadeElement.textContent);
                
                if (this.classList.contains('diminuir') && quantidade > 0) {
                    quantidade--;
                } else if (this.classList.contains('aumentar')) {
                    quantidade++;
                }
                
                quantidadeElement.textContent = quantidade;
                updatePedidoItens(id, quantidade, itemElement);
            });
        });
        
        // Atualiza a lista de itens selecionados
        function updatePedidoItens(id, quantidade, itemElement) {
            const itemInfo = {
                id,
                nome: itemElement.querySelector('h3').textContent,
                preco: parseFloat(itemElement.querySelector('.preco').textContent.replace('R$ ', '')),
                quantidade
            };
            
            if (quantidade === 0) {
                pedidoItens = pedidoItens.filter(item => item.id !== id);
            } else {
                const existingIndex = pedidoItens.findIndex(item => item.id === id);
                if (existingIndex >= 0) {
                    pedidoItens[existingIndex] = itemInfo;
                } else {
                    pedidoItens.push(itemInfo);
                }
            }
        }
        
        // Configura o botão de finalizar pedido
        if (finalizarPedidoBtn) {
            finalizarPedidoBtn.addEventListener('click', function() {
                if (pedidoItens.length === 0) {
                    alert('Por favor, selecione pelo menos um item antes de finalizar o pedido.');
                    return;
                }
                
                const telefone = "558597063315"; // Seu número de WhatsApp
                const mensagem = formatarMensagemWhatsApp(pedidoItens);
                const url = `https://wa.me/${telefone}?text=${encodeURIComponent(mensagem)}`;
                
                window.open(url, '_blank');
            });
        }
        
        // Formata a mensagem para o WhatsApp
        function formatarMensagemWhatsApp(itens) {
            let mensagem = "Olá, gostaria de fazer um pedido:\n\n";
            let total = 0;
            
            itens.forEach(item => {
                const subtotal = item.preco * item.quantidade;
                mensagem += `✔ ${item.nome} - ${item.quantidade}x R$ ${item.preco.toFixed(2)} = R$ ${subtotal.toFixed(2)}\n`;
                total += subtotal;
            });
            
            mensagem += `\n*Total: R$ ${total.toFixed(2)}*\n\n`;
            mensagem += "Nome: \nEndereço para entrega: \nData desejada: \n\nObrigada!";
            
            return mensagem;
        }
    }

    // Carregar feed do Instagram (simulado)
    function loadInstagramFeed() {
        const container = document.getElementById('instagram-feed');
        if (!container) return;
        
        container.innerHTML = `
            <div class="instagram-item">
                <img src="/images/Screenshot_1.png" alt="Instagram post">
                
            </div>
            <div class="instagram-item">
                <img src="/images/Screenshot_2.png" alt="Instagram post">
            </div>
            <div class="instagram-item">
                <img src="/images/Screenshot_3.png" alt="Instagram post">
            </div>
            <div class="instagram-item">
                <img src="/images/Screenshot_4.png" alt="Instagram post">
            </div>
        `;
    }
    
    loadInstagramFeed();
});
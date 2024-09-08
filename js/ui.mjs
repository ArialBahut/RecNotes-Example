export class ui {
    async init() {
        function initBuddyContent() {
            document.body.innerHTML = `
        <div class="split">
            <div id="leftPane" class="paneSystem">
                <div id="leftPaneMenu" class="mainMenu">
                    <img class="logo" src="svg/logo.svg" />
                </div>
                <div id="leftPaneContent" class="pane treeview"></div>
            </div>
            <div id="rightPane" class="paneSystem">
                <div id="rightPaneMenu" class="mainMenu"></div>
                <div id="rightPaneContent" class="pane"></div>
            </div>
        </div>
        `;
            Split(['#leftPane', '#rightPane'], { sizes: [30, 70], minSize: [220, 300], gutterSize: 6 })
        };
        initBuddyContent();
        this.previouslyLoadedPageId = -1;
        this.previouslyLoadedNotebookId = -1;
        this.savedTopicId = "";
        window.ui.topicTreeview = new treeview("leftPaneContent", this.tvTopicSelect);
        //load start info
        $.get("./startInfo.json", null, this.initContinue);
    }
    initContinue(startInfo) {
        document.getElementById("rightPaneMenu").innerHTML = `<span class="menuTitle">${startInfo.title}</span>`;
        const location = window.ui.getIds();
        if (location) {
            window.ui.navigate();
        } else {
            window.ui.loadCallBackAction = "selectFirstNobebookChild";
            window.ui.previouslyLoadedNotebookId = startInfo.notebookId;
            $("#leftPaneContent").load(`./htm/notebook${startInfo.notebookId}.htm`, window.ui.loadCallback);
        }
    }
    displayPages(selectedTopicNodeId) {
        function addChildrenPages(id) {
            pageIds.push(`p${id.substring(1)}`);
            const parentNode = document.getElementById(id);
            const nodekids = parentNode.querySelector('nodekids');
            if (nodekids) {
                nodekids.childNodes.forEach(node => {
                    pages.push(`<page><pageContent id=p${node.id.substring(1)}></pageContent>`);
                    addChildrenPages(node.id);
                    pages.push(`</page>`);
                });
            }
        }
        //pages structure
        var pages = [];
        var pageIds = [];
        pages.push(`<page><pageContent id=p${selectedTopicNodeId.substring(1)}></pageContent>`);
        addChildrenPages(selectedTopicNodeId);
        pages.push(`</page>`);
        document.getElementById("rightPaneContent").innerHTML = pages.join("");
        //pages content
        pageIds.forEach(pageId => {
            if (pageId.substring(1)===window.ui.savedTopicId.toString()) {
                $(`#${pageId}`).load(`./htm/page${pageId.substring(1)}.htm`, null, window.ui.selectEndlinkCallback);
            } else {
                $(`#${pageId}`).load(`./htm/page${pageId.substring(1)}.htm`);
            }
        });
    }
    getIds() {
        const location = window.location.href;
        const pos = location.indexOf('#');
        if (pos > 0) {
            const split = location.substring(pos + 1).split('.');
            if (split.length === 2) {
                const notebookId = parseInt(split[0]);
                const pageId = parseInt(split[1]);
                if (!isNaN(notebookId) && !isNaN(pageId)) {
                    return {notebookId: notebookId, pageId: pageId};
                }
            }
        }
    }
    goto(rootTopicId, topicId, targetEndlinkId) {
        window.ui.loadCallBackAction = "selectSavedTopicId";
        window.ui.savedTopicId = topicId;
        window.ui.savedEndlinkId = targetEndlinkId;
        $("#leftPaneContent").load(`./htm/notebook${rootTopicId}.htm`, window.ui.loadCallback);
    }
    //the jquery load callback returns parameters (by ref) that we do not use
    loadCallback() {
        if (window.ui.loadCallBackAction) {
            switch (window.ui.loadCallBackAction) {
                case "selectFirstNobebookChild":
                    const rootNode = document.getElementById("leftPaneContent").querySelector("node");
                    const firstChild = rootNode.querySelector("node");
                    const topicId = parseInt(firstChild.id.substring(1));
                    window.ui.navigate({pageId: topicId});               
                    break;
                case "selectSavedTopicId":
                    window.ui.navigate({pageId: window.ui.savedTopicId});
                    break;
            }
            window.ui.loadCallBackAction = null;
        } else {
            window.ui.navigate();
        }
    }
    navigate(target=null) {
        function setPageId(id) {
            const location = window.location.href;
            const pos = location.indexOf('#');
            let newLocation = (pos > 0) ? location.substring(0, pos) : location;
            newLocation = `${newLocation}#${window.ui.previouslyLoadedNotebookId}.${id}`;
            window.location.href = newLocation;
        }
        if (target) {
            if (target.hasOwnProperty("notebookId")) {

            }
            if (target.hasOwnProperty("pageId")) {
                setPageId(target.pageId);
            }
        }
        const location = window.ui.getIds();
        if (location) {
            if (location.notebookId === window.ui.previouslyLoadedNotebookId) {
                window.ui.topicTreeview.select(`t${location.pageId}`);
                window.ui.displayPages(`t${location.pageId}`);
            } else {
                window.ui.previouslyLoadedNotebookId = location.notebookId;
                $("#leftPaneContent").load(`./htm/notebook${location.notebookId}.htm`, window.ui.loadCallback);
            }
        }
    }
    pageTitleClick(event) {
        const pageId = event.target.parentElement.id;
        const id = parseInt(pageId.substring(1));
        this.navigate({pageId: id});
    }
    selectEndlinkCallback() {
        const reciprocalLink = document.getElementById(`lk${window.ui.savedEndlinkId}`)
        if (reciprocalLink) {
            reciprocalLink.classList.add("reciprocal");
        }
    }
    tvTopicSelect(nodeId) {
        const id = parseInt(nodeId.substring(1));
        window.ui.navigate({pageId: id});
    }
    tvToggleChildrenView(nodeId) {
        const node = document.getElementById(nodeId)
        const imageNode = node.querySelector("img")
        const kidsNode = node.querySelector("nodeKids")
        if (!kidsNode) { return } //the node does not have children
        const imageSrc = imageNode.getAttribute("src")
        if (imageSrc.includes("down")) {
            imageNode.setAttribute("src", "svg/right-arrow.svg")
            kidsNode.setAttribute("style", "visibility: collapse;")
        } else {
            imageNode.setAttribute("src", "svg/down-arrow.svg")
            kidsNode.removeAttribute("style")
        }
    }
}
class treeview {
    constructor(elementContainer, selectCallBack) {
        this.elementContainer = elementContainer;
        this.selectCallBack = selectCallBack;
    }
    click(id) {
        this.removeTopicTreeviewSelection();
        document.getElementById(id).setAttribute("selected", "true");
        this.selectCallBack(id);
    }
    removeTopicTreeviewSelection() {
        const elementContainer = document.getElementById(this.elementContainer);
        if (elementContainer) {
            const selected = elementContainer.querySelector('node[selected]');
            if (selected) {
                selected.attributes.removeNamedItem('selected');
            }
        }
    }
    select(id) {
        function showNode(node) {
            function showChildrenView(id) {
                const node = document.getElementById(id)
                const imageNode = node.querySelector("img")
                const kidsNode = node.querySelector("nodeKids")
                if (!kidsNode) { return } //the node does not have children
                const imageSrc = imageNode.getAttribute("src")
                if (imageSrc.includes("right")) {
                    imageNode.setAttribute("src", "svg/down-arrow.svg")
                    kidsNode.removeAttribute("style")
                }
            }
            //open parent and child nodes
            var parentNode = node.parentElement
            while (true) {
                if (parentNode.tagName === "NODE") {
                    showChildrenView(parentNode.id)
                } else if (parentNode.tagName === "DIV") {
                    break
                }
                parentNode = parentNode.parentElement
            }
            //..open child node
            showChildrenView(node.id)
        }
        this.removeTopicTreeviewSelection();
        let node = document.getElementById(id);
        if (node) {
            node.setAttribute("selected", "true");
            showNode(node);
        }
    }
}
$('#file-input').change(function (evnt) {
    const fileList = [];
    
    for (let i = 0; i < $("#file-input").prop('files').length; i++) {
        fileList.push($("#file-input").prop('files')[i]);
    }

    $.ajax({
            type: "POST",
            url: "upload_files",
            data: new FormData(this.closest("form")),
            dataType: 'json',
            processData: false,
            contentType: false,
            success: function(data){

            },
            error: function (e) {
                console.log("some error", e)
            }
    });
    
    renderFileList(fileList);
});

$("#upload-csv [type='file']").change(function (e) {
        e.preventDefault();
        $.ajax({
            type: "POST",
            url: "send_users",
			data: new FormData(this.closest("form")),
    		processData: false,
    		contentType: false,
            success: function(data){

            },
            error: function (e) {
                console.log("some error", e)
            }
        });
});

$("#contact-form").submit(function (e) {
        e.preventDefault();
        if (!window.addUserList) {
            alert('Please input users list');
            return false;
        }
        const data =($('#contact-form').serializeArray());
        const formData = new Object();

        data.forEach(item => {
            if(item.name === 'message'){
                formData[item.name] = $('#htmlsource').html()
            }else{
                formData[item.name] = item.value;
            }
        })
        console.log(formData)

        $.ajax({
            type: "POST",
            url: "send",
            data: JSON.stringify(formData),
            processData: false,
            contentType: 'application/json',
            success: function(data){
                render(JSON.parse(data));
                insertHiddenInput(data);
            },
            error: function (e) {
                console.log("some error", e);
            }
        });
});

const renderFileList = function (fileList) {
    $('#file-list-display').html('');
    fileList.forEach(function (file, index) {
        const fileDisplayEl = document.createElement('p');
        fileDisplayEl.innerHTML = (index + 1) + ': ' + file.name;
        $('#file-list-display').append(fileDisplayEl);
    });
};

const render = (data) => {
	let content ='<tr><th>Email</th><th>Username</th><th>Status</th></tr>';
	for(i=0; i<data.length; i++){
	    content += '<tr><td>' + data[i]['email'] + '</td><td>' + data[i]['username'] + '</td><td>'  + '</td></tr>';
	}
	$('#customers').html(content);
}

const insertHiddenInput = (data) => {
	$('#contact-form').append(`<input type="hidden" name="usersGroup" value=${data}>`);
    $( "#upload" ).addClass( "success" );
    $( "#upload-btn" ).val( "Upload Another Email List" );
}


const setWindowFlag = () => {
    window.addUserList = true;
}

const processErr = (msg) => {
    if(msg.code === 535){
        const info = 'Username and Password not matched';
        $('#error-msg').html(info);
    }
}

const processSent = (data) => {
    $('#customers tr:eq(' + data.index + ') td:eq(2)').text(data.state);
}

const socket = io.connect('http://localhost:3000');
    
socket.on('error',function(msg) {
    processErr(msg);
});

socket.on('sent',function(data) {
    console.log(data);
    processSent(data);
});

socket.on('emaillist',function(data) {
    const { users } = data;
    render(JSON.parse(users));
    insertHiddenInput(users);
    setWindowFlag();
});
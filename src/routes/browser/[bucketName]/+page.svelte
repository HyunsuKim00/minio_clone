<script lang="ts">
    let { data } = $props();
    
    // 바이트 크기를 읽기 쉬운 형식으로 변환
    function formatBytes(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    // 파일 확장자에 따른 아이콘 클래스
    function getFileType(key: string): string {
        if (key.endsWith('/')) return '📁 폴더';
        
        const ext = key.split('.').pop()?.toLowerCase() || '';
        
        if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg'].includes(ext)) return '🖼️ 이미지';
        if (['mp4', 'avi', 'mov', 'wmv', 'flv', 'webm'].includes(ext)) return '🎬 비디오';
        if (['mp3', 'wav', 'ogg', 'flac'].includes(ext)) return '🎵 오디오';
        if (['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'].includes(ext)) return '📄 문서';
        if (['zip', 'rar', '7z', 'tar', 'gz'].includes(ext)) return '🗜️ 압축파일';
        
        return '📄 파일';
    }
</script>

<div class="container">
    <div class="sidebar">
        <h3>버킷 목록</h3>
        <ul class="bucket-list">
            {#if data.buckets && data.buckets.length > 0}
                {#each data.buckets as bucket}
                    <li class={bucket.Name === data.bucketName ? 'active' : ''}>
                        <a href="/browser/{bucket.Name}">{bucket.Name}</a>
                    </li>
                {/each}
            {:else}
                <li class="no-buckets">버킷이 없습니다</li>
            {/if}
        </ul>
        
        <div class="home-link">
            <a href="/">홈으로 돌아가기</a>
        </div>
    </div>

    <div class="content">
        <div class="header">
            <h1>버킷: {data.bucketName}</h1>
            <p class="timestamp">마지막 업데이트: {new Date(data.timestamp).toLocaleString()}</p>
        </div>
        
        {#if data.objects && data.objects.length > 0}
            <table class="objects-table">
                <thead>
                    <tr>
                        <th>유형</th>
                        <th>이름</th>
                        <th>크기</th>
                        <th>마지막 수정</th>
                    </tr>
                </thead>
                <tbody>
                    {#each data.objects as object}
                        <tr>
                            <td>{getFileType(object.key)}</td>
                            <td>{object.key}</td>
                            <td class="size-cell">{formatBytes(object.size)}</td>
                            <td>
                                {#if object.lastModified}
                                    {new Date(object.lastModified).toLocaleString()}
                                {/if}
                            </td>
                        </tr>
                    {/each}
                </tbody>
            </table>
        {:else}
            <div class="empty-message">이 버킷에 객체가 없습니다.</div>
        {/if}
    </div>
</div>

<style>
    .container {
        display: flex;
        min-height: 100vh;
    }
    
    .sidebar {
        width: 250px;
        background-color: #f8f9fa;
        padding: 20px;
        border-right: 1px solid #dee2e6;
    }
    
    .content {
        flex: 1;
        padding: 20px;
    }
    
    .header {
        margin-bottom: 20px;
        border-bottom: 1px solid #dee2e6;
        padding-bottom: 10px;
    }
    
    h1 {
        margin: 0;
        color: #333;
    }
    
    .timestamp {
        color: #6c757d;
        font-size: 0.9em;
        margin-top: 5px;
    }
    
    .bucket-list {
        list-style-type: none;
        padding: 0;
        margin: 0;
    }
    
    .bucket-list li {
        margin-bottom: 8px;
        border-radius: 4px;
    }
    
    .bucket-list li.active {
        background-color: #e9ecef;
        font-weight: bold;
    }
    
    .bucket-list a {
        display: block;
        padding: 8px 12px;
        text-decoration: none;
        color: #007bff;
    }
    
    .bucket-list a:hover {
        background-color: #e9ecef;
    }
    
    .no-buckets {
        padding: 8px 12px;
        color: #6c757d;
    }
    
    .home-link {
        margin-top: 20px;
        padding-top: 15px;
        border-top: 1px solid #dee2e6;
    }
    
    .home-link a {
        display: inline-block;
        padding: 8px 12px;
        background-color: #4CAF50;
        color: white;
        text-decoration: none;
        border-radius: 4px;
    }
    
    .objects-table {
        width: 100%;
        border-collapse: collapse;
    }
    
    .objects-table th, .objects-table td {
        padding: 12px;
        text-align: left;
        border-bottom: 1px solid #dee2e6;
    }
    
    .objects-table th {
        background-color: #f8f9fa;
        font-weight: bold;
    }
    
    .objects-table tr:hover {
        background-color: #f8f9fa;
    }
    
    .size-cell {
        text-align: right;
    }
    
    .empty-message {
        padding: 20px;
        background-color: #f8f9fa;
        border-radius: 4px;
        color: #6c757d;
        text-align: center;
    }
</style>
const fs = require('fs');
let content = fs.readFileSync('components/DataViewerModal.tsx', 'utf8');

const target = `    for (const file of fileArray) {
      try {
        const fileExt = file.name.split('.').pop();
        const prefix = isPB ? \`pb\${suffix.toLowerCase()}_\` : '';
        
        const safeRecordId = btoa(encodeURIComponent(recordId)).substring(0, 10).replace(/[/+=]/g, '');
        const fileName = \`\${prefix}\${type}_\${safeRecordId}_\${Date.now()}.\${fileExt}\`;
        const filePath = \`master_data/\${type}/\${fileName}\`;

        const storageRef = ref(storage, filePath);
        await uploadBytesResumable(storageRef, file);
        const publicUrl = await getDownloadURL(storageRef);
        
        let tableName = 'internal_doors';
        if (type === 'storage') tableName = 'entrance_storages';
        if (type === 'handle') tableName = 'handle_master';
        if (type === 'baseboard') tableName = 'baseboard_master';

        const fieldName = isPB ? (pbSide ? \`pb_image_url_\${pbSide.toLowerCase()}\` : 'pb_image_url') : 'image_url';
        const idField = (type === 'baseboard') ? 'product' : (type === 'handle') ? 'name' : 'id';

        if (type === 'handle' || type === 'baseboard') {
          const payload = { [idField]: recordId, [fieldName]: publicUrl };
          const { data: existingRecord, error: findError } = await supabase.from(tableName).select('id').eq(idField, recordId).maybeSingle();

          if (findError) console.warn(\`Error finding record in \${tableName}:\`, findError.message);

          if (existingRecord) {
            const { error: dbError } = await supabase.from(tableName).update({ [fieldName]: publicUrl }).eq('id', existingRecord.id);
            if (dbError) throw new Error(\`更新に失敗しました: \${dbError.message}\`);
          } else {
            const { error: dbError } = await supabase.from(tableName).insert([payload]);
            if (dbError) throw new Error(\`新規登録に失敗しました: \${dbError.message}\`);
          }
        } else {
          const { error: dbError } = await supabase.from(tableName).update({ [fieldName]: publicUrl }).eq(idField, recordId);
          if (dbError) throw new Error(\`データベースの更新に失敗しました: \${dbError.message}\`);
        }

        if (type === 'storage') {
          setStorageTypes(prev => prev.map(item => item.id === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
        } else if (type === 'door') {
          const fieldKey = isPB ? (pbSide ? (pbSide === 'L' ? 'pbImageUrlL' : 'pbImageUrlR') : 'pbImageUrl') : 'imageUrl';
          setPriceList(prev => prev.map(item => item.id === recordId ? { ...item, [fieldKey]: publicUrl } : item));
        } else if (type === 'handle') {
          setHandleMaster(prev => prev.map(item => item.name === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
        } else if (type === 'baseboard') {
          setBaseboardMaster(prev => prev.map(item => item.product === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
        }
        successCount++;
      } catch (error: any) {
        let errorMsg = '通信エラーまたは権限エラーが発生しました。';
        if (error?.code === 'storage/unauthorized') errorMsg = '権限エラー: アップロードする権限がありません。';
        if (error?.code === 'storage/quota-exceeded') errorMsg = '容量エラー: 保存容量の上限に達しました。';
        
        console.error('Firebase Storage upload or DB update failed:', error);
        alert(\`アップロード失敗: \${errorMsg}\\n詳細: \${error.message}\`);
        failCount++;
      }
    }

    setUploadingId(null);
    if (fileArray.length > 1) {
      alert(\`一括アップロード完了\\n成功: \${successCount}件\\n失敗: \${failCount}件\`);
    }`;

const replacement = `    try {
      for (const file of fileArray) {
        try {
          const fileExt = file.name.split('.').pop();
          const prefix = isPB ? \`pb\${suffix.toLowerCase()}_\` : '';
          
          const safeRecordId = btoa(encodeURIComponent(recordId)).substring(0, 10).replace(/[/+=]/g, '');
          const fileName = \`\${prefix}\${type}_\${safeRecordId}_\${Date.now()}.\${fileExt}\`;
          const filePath = \`master_data/\${type}/\${fileName}\`;

          const storageRef = ref(storage, filePath);
          
          // Use Promise to handle uploadBytesResumable with events for better error catching on CORS
          await new Promise<void>((resolve, reject) => {
            const uploadTask = uploadBytesResumable(storageRef, file);
            uploadTask.on(
              'state_changed',
              null,
              (error) => {
                reject(error);
              },
              () => {
                resolve();
              }
            );
          });
          
          const publicUrl = await getDownloadURL(storageRef);
          
          let tableName = 'internal_doors';
          if (type === 'storage') tableName = 'entrance_storages';
          if (type === 'handle') tableName = 'handle_master';
          if (type === 'baseboard') tableName = 'baseboard_master';

          const fieldName = isPB ? (pbSide ? \`pb_image_url_\${pbSide.toLowerCase()}\` : 'pb_image_url') : 'image_url';
          const idField = (type === 'baseboard') ? 'product' : (type === 'handle') ? 'name' : 'id';

          if (type === 'handle' || type === 'baseboard') {
            const payload = { [idField]: recordId, [fieldName]: publicUrl };
            const { data: existingRecord, error: findError } = await supabase.from(tableName).select('id').eq(idField, recordId).maybeSingle();

            if (findError) console.warn(\`Error finding record in \${tableName}:\`, findError.message);

            if (existingRecord) {
              const { error: dbError } = await supabase.from(tableName).update({ [fieldName]: publicUrl }).eq('id', existingRecord.id);
              if (dbError) throw new Error(\`更新に失敗しました: \${dbError.message}\`);
            } else {
              const { error: dbError } = await supabase.from(tableName).insert([payload]);
              if (dbError) throw new Error(\`新規登録に失敗しました: \${dbError.message}\`);
            }
          } else {
            const { error: dbError } = await supabase.from(tableName).update({ [fieldName]: publicUrl }).eq(idField, recordId);
            if (dbError) throw new Error(\`データベースの更新に失敗しました: \${dbError.message}\`);
          }

          if (type === 'storage') {
            setStorageTypes(prev => prev.map(item => item.id === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
          } else if (type === 'door') {
            const fieldKey = isPB ? (pbSide ? (pbSide === 'L' ? 'pbImageUrlL' : 'pbImageUrlR') : 'pbImageUrl') : 'imageUrl';
            setPriceList(prev => prev.map(item => item.id === recordId ? { ...item, [fieldKey]: publicUrl } : item));
          } else if (type === 'handle') {
            setHandleMaster(prev => prev.map(item => item.name === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
          } else if (type === 'baseboard') {
            setBaseboardMaster(prev => prev.map(item => item.product === recordId ? { ...item, [isPB ? 'pbImageUrl' : 'imageUrl']: publicUrl } : item));
          }
          successCount++;
        } catch (error: any) {
          let errorMsg = '通信エラーまたは権限エラーが発生しました。';
          if (error?.code === 'storage/unauthorized') errorMsg = '権限エラー: アップロードする権限がありません。';
          if (error?.code === 'storage/quota-exceeded') errorMsg = '容量エラー: 保存容量の上限に達しました。';
          
          console.error('Firebase Storage upload or DB update failed:', error);
          alert(\`画像のアップロードに失敗しました\\n理由: \${errorMsg}\\n詳細: \${error.message}\`);
          failCount++;
        }
      }
    } finally {
      setUploadingId(null);
      if (fileArray.length > 1) {
        alert(\`一括アップロード完了\\n成功: \${successCount}件\\n失敗: \${failCount}件\`);
      }
    }`;

content = content.replace(target, replacement);

fs.writeFileSync('components/DataViewerModal.tsx', content);
console.log('done');

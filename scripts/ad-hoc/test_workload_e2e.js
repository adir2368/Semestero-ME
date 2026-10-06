const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(async () => {
    try {
        const win = new BrowserWindow({
            width: 1440,
            height: 900,
            show: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: path.join(__dirname, '..', '..', 'preload.js')
            }
        });

        const indexPath = path.join(__dirname, '..', '..', 'index.html');
        await win.loadFile(indexPath);
        await new Promise(r => setTimeout(r, 1200));

        // Test Scenario 1: Switch to Planner Tab
        const plannerInit = await win.webContents.executeJavaScript(`
            (async () => {
                if (typeof setActiveMainTab === 'function') {
                    setActiveMainTab('planner');
                } else {
                    const btn = document.getElementById('tab-planner');
                    if (btn) btn.click();
                }
                await new Promise(r => setTimeout(r, 600));
                return {
                    activeTab: document.body.getAttribute('data-active-tab') || 'planner',
                    colsCount: document.querySelectorAll('.planner-semester-col').length,
                    widgetsCount: document.querySelectorAll('.cheesefork-workload-widget').length
                };
            })()
        `);
        console.log('1. Planner Tab Init:', plannerInit);

        // Test Scenario 2: Switch to "Suggested" mode and test "year_2027" (Tashpaz)
        const switch2027 = await win.webContents.executeJavaScript(`
            (async () => {
                const btnSuggested = document.getElementById('btn-planner-mode-suggested');
                if (btnSuggested) btnSuggested.click();
                await new Promise(r => setTimeout(r, 200));

                const trackSelect = document.getElementById('planner-track-select');
                if (trackSelect) {
                    trackSelect.value = 'year_2027';
                    trackSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
                await new Promise(r => setTimeout(r, 600));

                // Inspect Semester 1 and Semester 2 courses for Tashpaz
                const sem1Col = document.querySelector('.planner-semester-col[data-semester="1"]');
                const sem1Courses = sem1Col ? Array.from(sem1Col.querySelectorAll('.course-card-title')).map(el => el.innerText.trim()) : [];
                const sem1Widget = sem1Col ? sem1Col.querySelector('.cheesefork-workload-widget').innerText.replace(/\\s+/g, ' ').trim() : '';

                const sem2Col = document.querySelector('.planner-semester-col[data-semester="2"]');
                const sem2Courses = sem2Col ? Array.from(sem2Col.querySelectorAll('.course-card-title')).map(el => el.innerText.trim()) : [];
                const sem2Widget = sem2Col ? sem2Col.querySelector('.cheesefork-workload-widget').innerText.replace(/\\s+/g, ' ').trim() : '';

                return {
                    sem1Courses,
                    sem1Widget,
                    sem2Courses,
                    sem2Widget
                };
            })()
        `);
        console.log('2. Year 2027 (תשפ״ז) Catalog Check:', switch2027);

        // Test Scenario 3: Switch to "Barak" track
        const switchBarak = await win.webContents.executeJavaScript(`
            (async () => {
                const trackSelect = document.getElementById('planner-track-select');
                if (trackSelect) {
                    trackSelect.value = 'barak';
                    trackSelect.dispatchEvent(new Event('change', { bubbles: true }));
                }
                await new Promise(r => setTimeout(r, 600));

                const sem1Col = document.querySelector('.planner-semester-col[data-semester="1"]');
                const sem1Courses = sem1Col ? Array.from(sem1Col.querySelectorAll('.course-card-title')).map(el => el.innerText.trim()) : [];
                const sem1Widget = sem1Col ? sem1Col.querySelector('.cheesefork-workload-widget').innerText.replace(/\\s+/g, ' ').trim() : '';

                return {
                    sem1Courses,
                    sem1Widget,
                    totalCols: document.querySelectorAll('.planner-semester-col').length
                };
            })()
        `);
        console.log('3. Barak Track Check:', switchBarak);

        // Test Scenario 4: Switch back to "Your Plan" (Custom Plan) and verify Adir's courses remain
        const customPlanCheck = await win.webContents.executeJavaScript(`
            (async () => {
                const btnCustom = document.getElementById('btn-planner-mode-custom');
                if (btnCustom) btnCustom.click();
                await new Promise(r => setTimeout(r, 500));

                const sem1Col = document.querySelector('.planner-semester-col[data-semester="1"]');
                const sem1Widget = sem1Col ? sem1Col.querySelector('.cheesefork-workload-widget').innerText.replace(/\\s+/g, ' ').trim() : '';
                const sem1Cards = sem1Col ? Array.from(sem1Col.querySelectorAll('.course-card-title')).map(el => el.innerText.trim()) : [];

                return {
                    sem1Widget,
                    sem1Cards
                };
            })()
        `);
        console.log('4. Custom Plan Persistence Check:', customPlanCheck);

        // Test Scenario 5: Interactive Workload Popover Trigger and Override
        const popoverTest = await win.webContents.executeJavaScript(`
            (async () => {
                // Find workload button for Chemistry Lab (125013) or Calculus
                const wlBtn = document.querySelector('.btn-course-workload');
                if (!wlBtn) return { error: 'No workload button found' };

                const courseCode = wlBtn.getAttribute('data-code');
                const initialScore = wlBtn.getAttribute('data-workload');

                // Click workload button to open popover
                wlBtn.click();
                await new Promise(r => setTimeout(r, 200));

                const popover = document.getElementById('workload-popover-overlay');
                const isVisible = popover && popover.style.display === 'flex';
                const slider = document.getElementById('workload-slider-val');
                if (!slider) return { error: 'Popover slider not rendered' };

                // Set custom score 4.5 on slider
                slider.value = '4.5';
                slider.dispatchEvent(new Event('input', { bubbles: true }));
                const saveBtn = document.getElementById('btn-workload-save');
                saveBtn.click();
                await new Promise(r => setTimeout(r, 500));

                // Check updated button and semester widget
                const updatedBtn = document.querySelector(\`.btn-course-workload[data-code="\${courseCode}"]\`);
                const hasOverrideClass = updatedBtn ? updatedBtn.classList.contains('has-override') : false;
                const newScore = updatedBtn ? updatedBtn.getAttribute('data-workload') : null;

                const parentSemCol = updatedBtn ? updatedBtn.closest('.planner-semester-col') : null;
                const updatedSemWidget = parentSemCol ? parentSemCol.querySelector('.cheesefork-workload-widget').innerText.replace(/\\s+/g, ' ').trim() : null;

                return {
                    courseCode,
                    initialScore,
                    popoverOpened: isVisible,
                    hasOverrideClass,
                    newScore,
                    updatedSemWidget
                };
            })()
        `);
        console.log('5. Interactive Popover & Override Test:', popoverTest);

        // Take screenshot of the planner with workload badges
        const screenshotBuf = await win.capturePage();
        const screenshotPath = path.join(__dirname, '..', '..', 'planner_workload_verified.png');
        fs.writeFileSync(screenshotPath, screenshotBuf.toPNG());
        console.log('Screenshot saved to:', screenshotPath);

    } catch (e) {
        console.error('Test failed with error:', e);
    } finally {
        app.quit();
    }
});
